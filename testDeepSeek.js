const OpenAI = require("openai");
require("dotenv").config(); // Load API keys from .env file

const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",
    apiKey: process.env.DEEPSEEK_API_KEY // Use your API key
});

async function testDeepSeek() {
    try {
        const completion = await openai.chat.completions.create({
            model: "deepseek-chat",
            messages: [{ role: "system", content: "Test message: How are you?" }],
            max_tokens: 50
        });

        console.log("✅ DeepSeek Response:", completion.choices[0].message.content);
    } catch (error) {
        console.error("❌ DeepSeek API Error:", error.response?.data || error.message);
    }
}

testDeepSeek();