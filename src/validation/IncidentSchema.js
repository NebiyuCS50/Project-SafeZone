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
  image: z.any().optional(),
  timestamp: z.string().min(1, "Date and time are required"),
});
