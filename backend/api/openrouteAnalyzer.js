import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { analyzeIncidentOpenRouter } from "../services/openrouter.js";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/geminiAnalyzer", async (req, res) => {
  try {
    const { incidentType, description } = req.body;
    const { aiConfidence } = await analyzeIncidentOpenRouter({
      incidentType,
      description,
    });
    console.log("OpenRouter AI Confidence:", aiConfidence);
    res.json({ aiConfidence });
  } catch (error) {
    console.error("openrouter API error:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`OpenRouter backend running on port ${PORT}`);
});
