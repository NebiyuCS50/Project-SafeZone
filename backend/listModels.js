import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY; // or GEMINI_API_KEY if that's what you use

async function listModels() {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
  );
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

listModels();
