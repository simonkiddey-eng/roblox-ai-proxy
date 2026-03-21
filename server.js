const express = require("express");
const app = express();
app.use(express.json());

app.post("/generate", async (req, res) => {
  try {
    const { systemPrompt, messages } = req.body;

    console.log("Request received");
    console.log("Messages count:", messages ? messages.length : 0);
    console.log("API Key set:", !!process.env.ANTHROPIC_API_KEY);
    console.log("API Key preview:", process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.slice(0, 16) + "..." : "MISSING");

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY environment variable is not set in Railway!" });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages array" });
    }

    const body = {
      model: "claude-3-haiku-20240307",
      max_tokens: 2048,
      system: systemPrompt || "You are a helpful Roblox developer assistant.",
      messages: messages
    };

    console.log("Calling Anthropic with model:", body.model);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    console.log("Anthropic HTTP status:", response.status);
    console.log("Anthropic response preview:", JSON.stringify(data).slice(0, 400));

    if (response.status === 200 && data.content && data.content[0]) {
      return res.json({ result: data.content[0].text });
    } else if (data.error) {
      console.error("Anthropic error:", data.error);
      return res.status(500).json({ error: "Anthropic error: " + (data.error.message || JSON.stringify(data.error)) });
    } else {
      return res.status(500).json({ error: "Unexpected response from Anthropic: " + JSON.stringify(data).slice(0, 300) });
    }

  } catch (err) {
    console.error("Server crash:", err.message);
    return res.status(500).json({ error: "Server crashed: " + err.message });
  }
});

// Health check — visit your URL in browser to confirm server is alive
app.get("/", (req, res) => {
  res.json({
    status: "AI Builder proxy is running!",
    apiKeySet: !!process.env.ANTHROPIC_API_KEY,
    time: new Date().toISOString()
  });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started on port", process.env.PORT || 3000);
  console.log("API Key set:", !!process.env.ANTHROPIC_API_KEY);
});
