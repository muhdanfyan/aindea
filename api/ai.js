import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Only allow POST methods
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { model: modelName, prompt } = req.body;
  let lastError = null;

  // 1. Try DeepSeek first
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    try {
      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${deepseekKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "You are a helpful assistant specialized in Wolio language and Buton culture." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.choices[0].message.content;

        return res.status(200).json({ text });
      } else {
        const errorData = await response.json();
        console.error("DeepSeek API error:", errorData);
        lastError = new Error(`DeepSeek error: ${errorData.error?.message || response.statusText}`);
      }
    } catch (error) {
      console.error("DeepSeek connection error:", error);
      lastError = error;
    }
  }

  // 2. Fallback to Gemini
  let apiKeys = Object.keys(process.env)
    .filter(key => key.startsWith("GEMINI_API_KEY_") && key !== "GEMINI_API_KEY_ULTIMATE_FALLBACK")
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map(key => process.env[key])
    .filter(value => !!value);

  const ultimateFallbackKey = process.env.GEMINI_API_KEY_ULTIMATE_FALLBACK;
  if (ultimateFallbackKey && !apiKeys.includes(ultimateFallbackKey)) {
    apiKeys.push(ultimateFallbackKey);
  }

  if (process.env.GEMINI_API_KEY && !apiKeys.includes(process.env.GEMINI_API_KEY)) {
    apiKeys.unshift(process.env.GEMINI_API_KEY);
  }

  if (apiKeys.length > 0) {
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const fallbackModel = modelName?.includes("gemini") ? modelName : "gemini-2.0-flash";
        const model = genAI.getGenerativeModel({ model: fallbackModel });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text });
      } catch (error) {
        console.error(`Gemini fallback attempt ${i + 1} failed:`, error.message);
        lastError = error;
      }
    }
  }

  return res.status(lastError?.status || 500).json({
    error: lastError?.message || "All AI services failed",
    details: "Please try again later."
  });
}
