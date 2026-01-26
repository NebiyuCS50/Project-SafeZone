import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function analyzeIncidentOpenRouter({
  incidentType,
  description,
  imageUrl,
}) {
  const prompt = `Incident Type: ${incidentType}
Description: ${description}
Rate the likelihood this is a real incident (0-1, just the number):
Respond with only a single floating point number between 0 and 1. No explanation.`;

  const messages = [
    {
      role: "system",
      content:
        "Respond ONLY with a single floating point number between 0 and 1. No words.",
    },
    {
      role: "user",
      content: [
        { type: "text", text: prompt },
        ...(imageUrl
          ? [{ type: "image_url", image_url: { url: imageUrl } }]
          : []),
      ],
    },
  ];

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: "gpt-4o",
      messages,
      temperature: 0,
      max_tokens: 10,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5001",
        "X-Title": "SafeZone",
      },
    },
  );

  console.log(
    "FULL OpenRouter response:",
    JSON.stringify(response.data, null, 2),
  );
  const text = response.data.choices[0].message.content.trim();
  console.log("Raw OpenRouter response:", text);
  const match = text.match(/(0(\.\d+)?|1(\.0+)?)/);
  const aiConfidence = match ? Number(match[0]) : null;
  return { aiConfidence: isNaN(aiConfidence) ? null : aiConfidence };
}
