const express = require('express');
// express-validator removed in favor of Zod
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const HiddenCategory = require('../models/HiddenCategory');
const { authenticateToken } = require('../middleware/auth');
const { parseBody, CreateTransactionSchema, UpdateTransactionSchema } = require('../middleware/validation');
const multer = require('multer');
const fs = require('fs');
const Groq = require('groq-sdk');
const { z } = require('zod');

const router = express.Router();
// Multer setup for single image upload (memory storage)
const upload = multer({ storage: multer.memoryStorage() });

// Helper: build JSON schema for response format using dynamic categories
function buildJsonSchema(categoryEnum) {
  return {
    type: 'object',
    properties: {
      record_flow: { type: 'string', enum: ['expense', 'income'] },
      record_title: { type: 'string' },
      record_amount: { type: 'number' },
      record_category: { type: 'string', enum: categoryEnum },
      record_description: { type: 'string' }
    },
    required: ['record_flow', 'record_title', 'record_amount', 'record_category', 'record_description']
  };
}

// @route   POST /api/transactions/analyze-image
// @desc    Analyze uploaded image and extract transaction fields
// @access  Private
router.post('/analyze-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }

    const base64Image = req.file.buffer.toString('base64');

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: 'GROQ_API_KEY not configured' });
    }

    // Build dynamic category enum for this user (default + custom, excluding hidden defaults)
    const userId = req.userId;
    const hidden = await HiddenCategory.find({ userId }).select('categoryId');
    const hiddenIds = new Set(hidden.map(h => h.categoryId.toString()));
    const cats = await Category.find({ userId }).select('name');
    const allowedCategories = cats
      .map(c => c.name)
      .sort((a, b) => a.localeCompare(b));

    if (allowedCategories.length === 0) {
      return res.status(400).json({ success: false, message: 'No categories available for analysis' });
    }

    // Build dynamic validators
    const RecordFlow = z.enum(['expense', 'income']);
    const CategoryEnum = z.enum(allowedCategories);
    const TransactionAnalysisSchema = z.object({
      record_flow: RecordFlow,
      record_title: z.string(),
      record_amount: z.number(),
      record_category: CategoryEnum,
      record_description: z.string()
    });

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const response = await client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a UPI transaction analyzer. Analyze the transaction receipt image and extract only the following fields as JSON using the provided schema: record_flow (expense|income), record_title (string), record_amount (number), record_category (string), record_description (string). Output JSON only. Be precise with the amount and concise with title/category/description.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this UPI transaction receipt and extract all relevant information in structured format.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'transaction_analysis', schema: buildJsonSchema(allowedCategories) }
      }
    });

    const raw = JSON.parse(response.choices?.[0]?.message?.content || '{}');

    // Normalize category to closest allowed match if needed
    function normalize(str) {
      return String(str || '').toLowerCase().trim();
    }
    function jaccardSimilarity(a, b) {
      const setA = new Set(normalize(a).split(/\s+/).filter(Boolean));
      const setB = new Set(normalize(b).split(/\s+/).filter(Boolean));
      if (setA.size === 0 || setB.size === 0) return 0;
      const intersection = new Set([...setA].filter(x => setB.has(x))).size;
      const union = new Set([...setA, ...setB]).size;
      return intersection / union;
    }
    function bestCategoryMatch(input, allowed) {
      const nInput = normalize(input);
      if (!nInput) return null;
      // Exact case-insensitive
      const exact = allowed.find(c => normalize(c) === nInput);
      if (exact) return exact;
      // Starts with
      const starts = allowed.find(c => normalize(c).startsWith(nInput) || nInput.startsWith(normalize(c)));
      if (starts) return starts;
      // Jaccard best
      let best = null, bestScore = 0;
      for (const c of allowed) {
        const s = jaccardSimilarity(c, nInput);
        if (s > bestScore) { bestScore = s; best = c; }
      }
      return bestScore >= 0.4 ? best : null;
    }

    const mappedCategory = bestCategoryMatch(raw.record_category, allowedCategories);
    if (mappedCategory) {
      raw.record_category = mappedCategory;
    } else {
      // Fallback to Other ... if available based on flow
      const flow = (raw.record_flow === 'income') ? 'income' : 'expense';
      const fallback = allowedCategories.find(c => normalize(c).includes('other') && (flow === 'income' ? normalize(c).includes('income') : normalize(c).includes('expense')))
        || (flow === 'income' ? 'Other Income' : 'Other Expense');
      if (allowedCategories.includes(fallback)) raw.record_category = fallback;
      else raw.record_category = allowedCategories[0];
    }

    const parsed = TransactionAnalysisSchema.parse(raw);

    return res.json({
      success: true,
      data: {
        record_flow: parsed.record_flow,
        record_title: parsed.record_title,
        record_amount: parsed.record_amount,
        record_category: parsed.record_category,
        record_description: parsed.record_description
      }
    });
  } catch (error) {
    console.error('Analyze image error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to analyze image' });
  }
});

// @route   POST /api/transactions/analyze-audio
// @desc    Analyze uploaded audio and extract transaction fields
// @access  Private
router.post('/analyze-audio', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No audio uploaded' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ success: false, message: 'GROQ_API_KEY not configured' });
    }

    // Build allowed categories for this user
    const userId = req.userId;
    const cats = await Category.find({ userId }).select('name');
    const allowedCategories = cats.map(c => c.name).sort((a, b) => a.localeCompare(b));
    if (allowedCategories.length === 0) {
      return res.status(400).json({ success: false, message: 'No categories available for analysis' });
    }

    const RecordFlow = z.enum(['expense', 'income']);
    const CategoryEnum = z.enum(allowedCategories);
    const TransactionAnalysisSchema = z.object({
      record_flow: RecordFlow,
      record_title: z.string(),
      record_amount: z.number(),
      record_category: CategoryEnum,
      record_description: z.string()
    });

    const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // 1) Transcribe audio
    const tmpPath = `audio-${Date.now()}.webm`;
    await fs.promises.writeFile(tmpPath, req.file.buffer);
    const transcription = await client.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: 'whisper-large-v3-turbo',
      response_format: 'verbose_json',
      language: 'en',
      temperature: 0
    });
    try { await fs.promises.unlink(tmpPath); } catch {}

    const text = transcription?.text || '';

    // 2) Ask LLM to structure the transcription to our schema
    const response = await client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'system',
          content: 'You are a voice transaction analyzer. Extract only these fields as JSON: record_flow (expense|income), record_title (string), record_amount (number), record_category (string; must be one of the provided list), record_description (string). Output JSON only.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Categories list: ${allowedCategories.join(', ')}` },
            { type: 'text', text: `Transcription: ${text}` }
          ]
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'transaction_analysis', schema: (function(){
          return {
            type: 'object',
            properties: {
              record_flow: { type: 'string', enum: ['expense', 'income'] },
              record_title: { type: 'string' },
              record_amount: { type: 'number' },
              record_category: { type: 'string', enum: allowedCategories },
              record_description: { type: 'string' }
            },
            required: ['record_flow', 'record_title', 'record_amount', 'record_category', 'record_description']
          };
        })() }
      }
    });

    const raw = JSON.parse(response.choices?.[0]?.message?.content || '{}');

    // Reuse mapping logic from image endpoint
    function normalize(str) { return String(str || '').toLowerCase().trim(); }
    function jaccardSimilarity(a, b) {
      const setA = new Set(normalize(a).split(/\s+/).filter(Boolean));
      const setB = new Set(normalize(b).split(/\s+/).filter(Boolean));
      if (setA.size === 0 || setB.size === 0) return 0;
      const intersection = new Set([...setA].filter(x => setB.has(x))).size;
      const union = new Set([...setA, ...setB]).size;
      return intersection / union;
    }
    function bestCategoryMatch(input, allowed) {
      const nInput = normalize(input);
      if (!nInput) return null;
      const exact = allowed.find(c => normalize(c) === nInput);
      if (exact) return exact;
      const starts = allowed.find(c => normalize(c).startsWith(nInput) || nInput.startsWith(normalize(c)));
      if (starts) return starts;
      let best = null, bestScore = 0;
      for (const c of allowed) {
        const s = jaccardSimilarity(c, nInput);
        if (s > bestScore) { bestScore = s; best = c; }
      }
      return bestScore >= 0.4 ? best : null;
    }
    const mappedCategory = bestCategoryMatch(raw.record_category, allowedCategories);
    if (mappedCategory) raw.record_category = mappedCategory; else raw.record_category = allowedCategories[0];

    const parsed = TransactionAnalysisSchema.parse(raw);
    return res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Analyze audio error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to analyze audio' });
  }
});

// express-validator validation removed; using Zod below

// Zod query parser
const ListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional()
});

const parseQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.issues });
  }
  req.query = result.data;
  next();
};

// @route   GET /api/transactions
// @desc    Get user's transactions with filtering and pagination
// @access  Private
router.get('/', authenticateToken, parseQuery(ListQuerySchema), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      startDate,
      endDate,
      search
    } = req.query;

    const userId = req.userId;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter object
    const filter = { userId };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        // Create date at start of day in local timezone
        const start = new Date(startDate + 'T00:00:00');
        filter.date.$gte = start;
      }
      if (endDate) {
        // Create date at end of day in local timezone
        const end = new Date(endDate + 'T23:59:59.999');
        filter.date.$lte = end;
      }
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    // Get transactions with pagination
    const transactions = await Transaction.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Transaction.countDocuments(filter);

    // Calculate financial summary
    const summary = await Transaction.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const income = summary.find(s => s._id === 'income')?.total || 0;
    const expense = summary.find(s => s._id === 'expense')?.total || 0;
    const balance = income - expense;

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        },
        summary: {
          totalIncome: income,
          totalExpense: expense,
          balance,
          transactionCount: summary.reduce((acc, s) => acc + s.count, 0)
        }
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: { transaction }
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction'
    });
  }
});

// @route   POST /api/transactions
// @desc    Create new transaction
// @access  Private
router.post('/', authenticateToken, (req, res, next) => {
  // Coerce numeric body fields before Zod
  if (req.body && typeof req.body.amount === 'string') {
    const n = parseFloat(req.body.amount);
    if (!Number.isNaN(n)) req.body.amount = n;
  }
  next();
}, parseBody(CreateTransactionSchema), async (req, res) => {
  try {
    const { title, amount, category, type, date, description } = req.body;
    const userId = req.userId;

    // Verify category exists and belongs to user or is default
    const categoryDoc = await Category.findOne({
      name: category,
      userId
    });

    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    // Create date in Indian timezone
    const createIndianDate = (inputDate) => {
      if (inputDate) {
        // If date is provided, combine it with current time in Indian timezone
        const now = new Date();
        const indianTimeString = now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
        const indianTime = new Date(indianTimeString);
        
        // Extract date parts from input date
        const inputDateObj = new Date(inputDate);
        const year = inputDateObj.getFullYear();
        const month = inputDateObj.getMonth();
        const day = inputDateObj.getDate();
        
        // Create new date with input date but current time
        const finalDate = new Date(year, month, day, indianTime.getHours(), indianTime.getMinutes(), indianTime.getSeconds());
        return finalDate;
      } else {
        // If no date provided, create current date in Indian timezone
        const now = new Date();
        const indianTimeString = now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"});
        return new Date(indianTimeString);
      }
    };

    const transactionDate = createIndianDate(date);

    const transaction = new Transaction({
      userId,
      title,
      amount,
      category,
      type,
      date: transactionDate,
      description
    });

    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction'
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', authenticateToken, (req, res, next) => {
  if (req.body && typeof req.body.amount === 'string') {
    const n = parseFloat(req.body.amount);
    if (!Number.isNaN(n)) req.body.amount = n;
  }
  next();
}, parseBody(UpdateTransactionSchema), async (req, res) => {
  try {
    const { title, amount, category, type, date, description } = req.body;
    const userId = req.userId;

    // Verify category exists and belongs to user or is default
    const categoryDoc = await Category.findOne({
      name: category,
      userId
    });

    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId },
      {
        title,
        amount,
        category,
        type,
        date: date ? new Date(date) : undefined,
        description
      },
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction'
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction'
    });
  }
});

module.exports = router;
