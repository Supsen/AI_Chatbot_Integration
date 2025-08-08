// scripts/listTools.js
require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const assistantId = process.env.ASSISTANT_ID;

async function listTools() {
  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    const tools = assistant.tools || [];

    console.log(`Assistant "${assistant.name}" has ${tools.length} tool(s):`);
    tools.forEach((tool, index) => {
      console.log(` ${index + 1}. ${tool.function.name}`);
    });
  } catch (error) {
    console.error("Error fetching assistant tools:", error.response?.data || error.message);
  }
}

listTools();