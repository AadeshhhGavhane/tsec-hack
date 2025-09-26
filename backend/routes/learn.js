const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { z } = require('zod');
const { parseBody } = require('../middleware/validation');
const Groq = require('groq-sdk');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const LearnProfile = require('../models/LearnProfile');

const router = express.Router();

const GenerateSchema = z.object({
  topic: z.enum(['Savings', 'Credit Score', 'Investing Basics', 'Budgeting']),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  length: z.union([z.literal(5), z.literal(7)]).default(5)
});

const QuizSchema = z.object({
  topic: z.string(),
  difficulty: z.string(),
  length: z.number(),
  seed: z.string(),
  questions: z.array(z.object({
    text: z.string().min(8).max(240),
    options: z.array(z.string().min(1)).length(4),
    correctIndex: z.number().int().min(0).max(3),
    explanation: z.string().max(200)
  })).min(1)
});

router.post('/quizzes/generate', authenticateToken, parseBody(GenerateSchema), async (req, res) => {
  try {
    const { topic, difficulty, length } = req.body;
    const userId = req.userId;
    const seed = `${topic}-${difficulty}-${length}-${Date.now()}`;

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: 'Generate a short finance education quiz. JSON only.' },
        { role: 'user', content: `Topic: ${topic}\nDifficulty: ${difficulty}\nLength: ${length}\nConstraints: 4 options, exactly 1 correct, concise explanations (<= 200 chars), no NSFW, no abusive language, finance education only.` }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'quiz',
          schema: {
            type: 'object',
            properties: {
              topic: { type: 'string' },
              difficulty: { type: 'string' },
              length: { type: 'number' },
              seed: { type: 'string' },
              questions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    text: { type: 'string' },
                    options: { type: 'array', items: { type: 'string' } },
                    correctIndex: { type: 'number' },
                    explanation: { type: 'string' }
                  },
                  required: ['text','options','correctIndex','explanation']
                }
              }
            },
            required: ['topic','difficulty','length','questions']
          }
        }
      }
    });

    const raw = JSON.parse(response.choices?.[0]?.message?.content || '{}');
    raw.seed = seed;
    const parsed = QuizSchema.parse(raw);

    const quiz = await Quiz.create({ userId, ...parsed });
    res.json({ success: true, data: { quiz } });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate quiz' });
  }
});

const SubmitSchema = z.object({ answers: z.array(z.number().int().min(0).max(3)) , timeTakenSec: z.number().int().min(0).optional()});

router.post('/quizzes/:id/submit', authenticateToken, parseBody(SubmitSchema), async (req, res) => {
  try {
    const { answers, timeTakenSec = 0 } = req.body;
    const userId = req.userId;
    const quiz = await Quiz.findOne({ _id: req.params.id, userId });
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const correct = quiz.questions.map(q => q.correctIndex);
    const total = quiz.questions.length;
    const right = answers.reduce((acc, a, i) => acc + (a === correct[i] ? 1 : 0), 0);
    const score = Math.round((right / total) * 100);

    const attempt = await QuizAttempt.create({ userId, quizId: quiz._id, answers, score, timeTakenSec });

    // Update streak
    const profile = await LearnProfile.findOneAndUpdate(
      { userId },
      {},
      { upsert: true, new: true }
    );
    const now = new Date();
    const last = profile.lastQuizAt ? new Date(profile.lastQuizAt) : null;
    let streak = profile.streakCount || 0;
    if (!last) streak = 1;
    else {
      const days = Math.floor((now - new Date(last.setHours(0,0,0,0))) / (24*60*60*1000));
      if (days === 0) { /* same day, keep streak */ }
      else if (days === 1) streak += 1;
      else streak = 1; // reset
    }
    profile.streakCount = streak;
    profile.lastQuizAt = now;
    await profile.save();

    const breakdown = quiz.questions.map((q, i) => ({
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      userIndex: answers[i] ?? -1,
      explanation: q.explanation
    }));

    res.json({ success: true, data: { score, right, total, attemptId: attempt._id, breakdown, streak } });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit quiz' });
  }
});

router.get('/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const attempts = await QuizAttempt.find({ userId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json({ success: true, data: { attempts } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load history' });
  }
});

router.get('/attempts/:attemptId', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const attempt = await QuizAttempt.findOne({ _id: req.params.attemptId, userId }).lean();
    if (!attempt) return res.status(404).json({ success: false, message: 'Not found' });
    const quiz = await Quiz.findById(attempt.quizId).lean();
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz missing' });
    const report = quiz.questions.map((q, i) => ({ text: q.text, options: q.options, correctIndex: q.correctIndex, userIndex: attempt.answers[i] ?? -1, explanation: q.explanation }));
    res.json({ success: true, data: { quiz: { topic: quiz.topic, difficulty: quiz.difficulty, length: quiz.length, createdAt: quiz.createdAt }, report, score: attempt.score, timeTakenSec: attempt.timeTakenSec } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load attempt' });
  }
});

router.get('/recommend', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const profile = await LearnProfile.findOne({ userId });
    // Simple heuristic: default to Budgeting Beginner 5 unless history shows weakness
    const last = await QuizAttempt.findOne({ userId }).sort({ createdAt: -1 }).lean();
    const rec = last && last.score < 70 ? { topic: 'Credit Score', difficulty: 'Beginner', length: 5 } : { topic: 'Budgeting', difficulty: 'Beginner', length: profile?.preferredLength || 5 };
    res.json({ success: true, data: { recommend: rec } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to recommend' });
  }
});

module.exports = router;


