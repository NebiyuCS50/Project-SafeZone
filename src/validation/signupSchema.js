import { z } from "zod";

export const SignupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phoneNumber: z.string().refine(
      (val) => {
        if (!val) return false;

        if (val.startsWith("+251")) {
          return /^\+251\d{8}$/.test(val);
        }

        if (val.startsWith("09")) {
          return /^09\d{8}$/.test(val);
        }
        return false;
      },
      {
        message:
          "Phone must start with +251 (12 chars total) or 09 (10 chars total)",
      }
    ),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string().min(8, "Confirm password must match"),
    photoUrl: z.url("Enter a valid image URL").optional(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });
