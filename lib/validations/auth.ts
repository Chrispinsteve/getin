import { z } from "zod"

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
})

export type SignUpFormData = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export type SignInFormData = z.infer<typeof signInSchema>

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password confirmation is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>

