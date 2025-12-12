import { z } from "zod";
export const IncidentSchema = z.object({
  incidentType: z.string().min(1, "Please select an incident type"),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  image: z
    .any()
    .refine((file) => file instanceof File, "Image is required")
    .refine(
      (file) =>
        file && ["image/jpeg", "image/png", "image/jpg"].includes(file.type),
      "Only JPG/PNG images allowed"
    )
    .refine((file) => file && file.size <= 5 * 1024 * 1024, "Max size is 5MB"),
  timestamp: z.string().min(1, "Date and time are required"),
});
