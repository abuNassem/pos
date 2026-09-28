
import { z } from "zod";

const setupAdminSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must not exceed 100 characters"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must not exceed 100 characters"),

  nationalId: z
    .string()
    .trim()
    .max(20, "National ID must not exceed 20 characters")
    .optional(),

  birthDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Birth date must have format YYYY-MM-DD"
    )
    .optional(),
});

export const validateSetupAdmin = (req, res, next) => {
  const result = setupAdminSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }

  // نضع البيانات التي تم تنظيفها والتحقق منها
  // مرة أخرى في request
  req.body = result.data;

  next();
};



const loginUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(100, "Username must not exceed 100 characters"),

  password: z
    .string()
    
});

export const validateLoginUser = (req, res, next) => {
  const result = loginUserSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.error.flatten().fieldErrors,
    });
  }

  // نضع البيانات التي تم تنظيفها والتحقق منها
  // مرة أخرى في request
  req.body = result.data;

  next();
};
