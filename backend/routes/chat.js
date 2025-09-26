const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { z } = require('zod');
const Groq = require('groq-sdk');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

const router = express.Router();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = process.env.CHAT_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

const ChatSchema = z.object({ messages: z.array(z.object({ role: z.enum(['system','user','assistant','tool']).optional(), content: z.string(), name: z.string().optional(), tool_call_id: z.string().optional() })) });

router.post('/tool', authenticateToken, async (req, res) => {
  try {
    const { messages } = ChatSchema.parse(req.body);
    const userId = req.userId;

    const tools = [
      {
        type: 'function',
        function: {
          name: 'get_user_categories',
          description: 'Get the current user\'s categories (strings). Optionally filter by type.',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['income','expense'] }
            }
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'extract_transaction',
          description: 'Extract transaction fields (title, amount, category, type, description) from free text using user\'s allowed categories.',
          parameters: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Free text to parse, e.g., "add lunch 250"' },
              typeHint: { type: 'string', enum: ['income','expense'], description: 'Optional type hint' }
            },
            required: ['text']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'create_transaction',
          description: 'Create a transaction. Date defaults to now. Amount can be numeric string (e.g., "500").',
          parameters: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              amount: { type: 'string', description: 'numeric value as string, e.g., "500" or "500.00"' },
              category: { type: 'string' },
              type: { type: 'string', enum: ['income','expense'] },
              description: { type: 'string' }
            },
            required: ['title','amount','type']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'list_transactions',
          description: 'List recent transactions for the user with optional filters',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number' },
              type: { type: 'string', enum: ['income','expense'] },
              category: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string' }
            }
          }
        }
      }
    ];

    const system = {
      role: 'system',
      content: 'You are a finance assistant. You can add transactions and list them using tools. When the user asks to add a transaction, FIRST use extract_transaction to parse (title, amount, category, type, description) and prefer categories from get_user_categories. Ask at most one short follow-up if title/amount is missing. Default type to expense unless clearly income. Always use only categories returned by get_user_categories. Keep replies concise and mobile-friendly.'
    };

    if (!process.env.GROQ_API_KEY) {
      return res.json({ success: true, data: { reply: 'AI is not configured yet. Please provide a title and amount, e.g., “add lunch 250”.' } });
    }

    const first = await client.chat.completions.create({
      model: MODEL,
      messages: [system, ...messages],
      tools,
      tool_choice: 'auto'
    });

    const assistantMsg = first.choices[0].message;
    const toolCalls = assistantMsg.tool_calls || [];
    if (toolCalls.length === 0 && (assistantMsg.content || '').trim()) {
      return res.json({ success: true, data: { reply: assistantMsg.content } });
    }
    const convo = [system, ...messages, assistantMsg];

    for (const call of toolCalls) {
      const name = call.function.name;
      const args = JSON.parse(call.function.arguments || '{}');
      let result;
      if (name === 'get_user_categories') {
        const query = { userId };
        if (args.type) query.type = args.type;
        const cats = await Category.find(query).select('name').lean();
        result = { categories: cats.map(c=>c.name) };
      } else if (name === 'extract_transaction') {
        const normalize = (s)=> String(s||'').toLowerCase().trim();
        const text = String(args.text || '').slice(0, 500);
        const flowHint = args.typeHint === 'income' ? 'income' : 'expense';
        const cats = await Category.find({ userId, type: flowHint }).select('name').lean();
        const allowedCategories = cats.map(c=>c.name).sort((a,b)=>a.localeCompare(b));

        if (!process.env.GROQ_API_KEY) {
          result = { ok: false, message: 'LLM not configured' };
        } else if (allowedCategories.length === 0) {
          result = { ok: false, message: 'No categories' };
        } else {
          const extractor = await client.chat.completions.create({
            model: MODEL,
            messages: [
              { role: 'system', content: 'Extract only these fields as JSON: record_flow (expense|income), record_title (string), record_amount (number), record_category (string; must be one of the provided list), record_description (string). Output JSON only.' },
              { role: 'user', content: [
                { type: 'text', text: `Categories list: ${allowedCategories.join(', ')}` },
                { type: 'text', text: `Text: ${text}` }
              ] }
            ],
            response_format: { type: 'json_schema', json_schema: { name: 'transaction_analysis', schema: (function(){ return { type: 'object', properties: { record_flow: { type: 'string', enum: ['expense','income'] }, record_title: { type: 'string' }, record_amount: { type: 'number' }, record_category: { type: 'string', enum: allowedCategories }, record_description: { type: 'string' } }, required: ['record_flow','record_title','record_amount','record_category','record_description'] }; })() } }
          });
          let raw = {};
          try { raw = JSON.parse(extractor.choices?.[0]?.message?.content || '{}'); } catch {}

          const jaccard = (a,b)=>{ const A=new Set(normalize(a).split(/\s+/).filter(Boolean)); const B=new Set(normalize(b).split(/\s+/).filter(Boolean)); if(!A.size||!B.size) return 0; const inter=[...A].filter(x=>B.has(x)).length; const uni=new Set([...A,...B]).size; return inter/uni; };
          const bestCategoryMatch = (input, allowed) => {
            const nInput = normalize(input);
            if (!nInput) return null;
            const exact = allowed.find(c => normalize(c) === nInput);
            if (exact) return exact;
            const starts = allowed.find(c => normalize(c).startsWith(nInput) || nInput.startsWith(normalize(c)));
            if (starts) return starts;
            let best=null, bestScore=0; for(const c of allowed){ const s=jaccard(c, nInput); if(s>bestScore){ bestScore=s; best=c; } }
            return bestScore>=0.4 ? best : null;
          };
          const mappedCategory = bestCategoryMatch(raw.record_category, allowedCategories);
          const flow = (raw.record_flow === 'income') ? 'income' : 'expense';
          const fallback = allowedCategories.find(c => normalize(c).includes('other') && (flow === 'income' ? normalize(c).includes('income') : normalize(c).includes('expense')))
            || (flow === 'income' ? 'Other Income' : 'Other Expense');
          const finalCategory = mappedCategory || (allowedCategories.includes(fallback) ? fallback : allowedCategories[0]);

          result = { ok: true, data: {
            title: String(raw.record_title || '').slice(0,100),
            amount: String(raw.record_amount != null ? raw.record_amount : ''),
            category: finalCategory,
            type: flow,
            description: String(raw.record_description || '').slice(0,200)
          } };
        }
      } else if (name === 'create_transaction') {
        const normalize = (s)=> String(s||'').toLowerCase().trim();
        const jaccard = (a,b)=>{ const A=new Set(normalize(a).split(/\s+/).filter(Boolean)); const B=new Set(normalize(b).split(/\s+/).filter(Boolean)); if(!A.size||!B.size) return 0; const inter=[...A].filter(x=>B.has(x)).length; const uni=new Set([...A,...B]).size; return inter/uni; };
        const bestCategory = async (hint) => {
          const cats = await Category.find({ userId, type: args.type==='income'?'income':'expense' }).select('name').lean();
          const names = cats.map(c=>c.name);
          // Prefer exact or startsWith
          const nHint = normalize(hint);
          let cand = names.find(n=> normalize(n)===nHint) || names.find(n=> normalize(n).startsWith(nHint) || nHint.startsWith(normalize(n)));
          if (cand) return cand;
          // Jaccard
          let best=null,score=0; for(const n of names){ const s=jaccard(n, nHint); if(s>score){score=s; best=n;} }
          if (score>=0.4) return best;
          // Fallback Other
          const other = names.find(n=> /other/i.test(n));
          return other || names[0] || 'Other Expense';
        };

        const parsedAmount = Number(String(args.amount||'').replace(/[^0-9.]/g,''));
        if (!parsedAmount || parsedAmount<=0) {
          result = { ok:false, message:'Please provide a valid amount.' };
        } else {
          let categoryName = String(args.category||'').trim();
          if (!categoryName) categoryName = await bestCategory(args.title||'');
          const exists = await Category.findOne({ userId, name: categoryName });
          if (!exists) categoryName = await bestCategory('Other');
          const payload = {
            userId,
            title: String(args.title || '').slice(0,100),
            amount: Math.max(0.01, parsedAmount),
            category: categoryName,
            type: args.type === 'income' ? 'income':'expense',
            date: new Date(),
            description: String(args.description||'').slice(0,200)
          };
          const tx = new Transaction(payload);
          await tx.save();
          result = { ok: true, transaction: tx };
        }
      } else if (name === 'list_transactions') {
        const filter = { userId };
        if (args.type) filter.type = args.type;
        if (args.category) filter.category = args.category;
        if (args.startDate || args.endDate) {
          filter.date = {};
          if (args.startDate) filter.date.$gte = new Date(args.startDate);
          if (args.endDate) filter.date.$lte = new Date(args.endDate);
        }
        const limit = Math.min(20, Math.max(1, Number(args.limit||10)));
        const txs = await Transaction.find(filter).sort({ date:-1, createdAt:-1 }).limit(limit).lean();
        result = { transactions: txs };
      } else {
        result = { error: 'Unknown tool' };
      }
      convo.push({ role: 'tool', tool_call_id: call.id, name, content: JSON.stringify(result) });
    }

    const second = await client.chat.completions.create({ model: MODEL, messages: convo });
    const finalContent = second.choices?.[0]?.message?.content || 'Done.';
    return res.json({ success: true, data: { reply: finalContent } });
  } catch (error) {
    console.error('Chat tool error:', error);
    res.status(500).json({ success: false, message: 'Chat failed' });
  }
});

module.exports = router;


