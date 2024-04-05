import { object, string, number, array, boolean } from "zod";

export const AuthSchema = object({
  firstName: string(),
  lastName: string(),
  email: string().email(),
  password: string().min(6),
  isAdmin: boolean(),
});

export const LoginSchema = object({
  email: string().email(),
  password: string().min(6),
});
