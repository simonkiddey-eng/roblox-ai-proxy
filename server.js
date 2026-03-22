const express = require("express");
const app = express();
app.use(express.json());

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

app.post("/generate", async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body;

    console.log("Request received, messages:", messages ? messages.length : 0);
    console.log("API Key set:", !!process.env.GEMINI_API_KEY);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not set in Railway environment variables!" });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Missing or empty messages array" });
    }

    // Convert to Gemini format
    const geminiContents = messages.map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const body = {
      system_instruction: {
        parts: [{ text: systemPrompt || "You are a helpful Roblox developer assistant." }]
      },
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      }
    };

    console.log("Calling Gemini 2.0 Flash...");

    const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    console.log("Gemini HTTP status:", response.status);
    console.log("Gemini response preview:", JSON.stringify(data).slice(0, 400));

    if (response.status === 200 && data.candidates && data.candidates[0]) {
      const text = data.candidates[0].content.parts[0].text;
      return res.json({ result: text });
    } else if (data.error) {
      console.error("Gemini error:", data.error);
      return res.status(500).json({ error: "Gemini error: " + (data.error.message || JSON.stringify(data.error)) });
    } else {
      return res.status(500).json({ error: "Unexpected response: " + JSON.stringify(data).slice(0, 300) });
    }

  } catch (err) {
    console.error("Server crash:", err.message);
    return res.status(500).json({ error: "Server crashed: " + err.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "AI Builder proxy is running with Gemini 2.0 Flash!",
    apiKeySet: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString()
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started on port", process.env.PORT || 3000);
  console.log("Gemini API Key set:", !!process.env.GEMINI_API_KEY);
});
