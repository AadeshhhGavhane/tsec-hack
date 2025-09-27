const { z } = require('zod');

// Common Zod helpers
const EmailSchema = z.string().email().transform((val) => {
  // Lowercase only (preserve dots and subaddresses)
  return val.toLowerCase();
});

const RegisterSchema = z.object({
  email: EmailSchema,
  password: z
    .string()
    .min(6)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: z.string().trim().min(2).max(50)
});

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1)
});

const CreateCategorySchema = z.object({
  name: z.string().trim().min(2).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(20).optional(),
  type: z.enum(['income', 'expense']).default('expense')
});

const UpdateCategorySchema = CreateCategorySchema.partial();

const CreateTransactionSchema = z.object({
  title: z.string().trim().min(3).max(100),
  amount: z.number().min(0.01).max(999999999),
  category: z.string().trim().min(1),
  type: z.enum(['income', 'expense']),
  date: z.string().optional(),
  description: z.string().trim().max(500).optional(),
  roundUpEnabled: z.boolean().optional().default(false),
  roundUpAmount: z.number().min(0).optional().default(0)
});

const UpdateTransactionSchema = CreateTransactionSchema; // same rules

// Generic parser middleware
const parseBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: result.error.issues });
  }
  req.body = result.data;
  next();
};

module.exports = {
  parseBody,
  RegisterSchema,
  LoginSchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateTransactionSchema,
  UpdateTransactionSchema
};
