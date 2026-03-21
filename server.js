const express = require("express");
const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  const { prompt, mode } = req.body;

  const systemPrompt = mode === "script"
    ? "You are a Roblox Luau scripting expert. Write clean, working Roblox scripts. Output ONLY the script code, no explanation, no markdown."
    : "You are a Roblox Studio build assistant. Give clear, step-by-step build instructions using Roblox part properties. Be specific and concise.";

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  res.json({ result: data.content[0].text });
});

app.listen(process.env.PORT || 3000);
