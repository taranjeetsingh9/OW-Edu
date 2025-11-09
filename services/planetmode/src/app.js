const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const path = require("path");
const axios = require("axios");

// Import routes
const planetModeRoutes = require("./routes/planetMode.routes");

dotenv.config();


const app = express();
const PORT = 4040;
const MONGO_URI = process.env.MONGO_URI;

/* ---------------------- Middleware ---------------------- */
app.use(cors());
app.use(express.json());


/* ---------------------- MongoDB ---------------------- */
if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) =>
      console.error(" MongoDB connection error:", err.message)
    );
} else {
  console.warn("MONGO_URI not set — skipping database connection.");
}

/* ---------------------- GeminiService (inline) ---------------------- */
class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/models";
  }

  async generateContent(prompt) {
    if (!this.apiKey) throw new Error("Missing GEMINI_API_KEY");

    const url = `${this.baseUrl}/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    const body = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      const response = await axios.post(url, body, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      });

      const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!raw) throw new Error("Empty Gemini response");

      try {
        return JSON.parse(raw);
      } catch {
        console.warn("Gemini returned non-JSON output, using fallback text.");
        return { text: raw };
      }
    } catch (err) {
      console.error(" Gemini API request failed:", err.message);
      throw err;
    }
  }
}

// Instantiate Gemini and expose globally
const gemini = new GeminiService();
app.locals.gemini = gemini;

/* ---------------------- Routes ---------------------- */
app.use("/planetmode", planetModeRoutes);

/* ---------------------- Static Frontend ---------------------- */
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});


/* ---------------------- Server Start ---------------------- */
app.listen(PORT, () => {
  console.log(` PlanetMode service running at http://localhost:${PORT}`);

  if (!process.env.GEMINI_API_KEY)
    console.warn("⚠️ GEMINI_API_KEY not set — fallback mode active.");
});

module.exports = app;
