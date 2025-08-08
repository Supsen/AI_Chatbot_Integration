const db = require("../config/db");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function sendPreInstruction(threadId, userId, options = {}) {
  try {
    const [rows] = await db.execute(
      "SELECT nickname, age, profession, income_range, financial_goals, extra_info, risk_tolerance, communication_style FROM user_bot_settings WHERE user_id = ?",
      [userId]
    );

    if (!rows.length) return;

    const user = rows[0];

    const instruction = `
${options.updated ? "**Updated preferences received.**" : "**Initial preferences set.**"}

- Name: ${user.nickname || "User"}
- Age: ${user.age || "N/A"}
- Profession: ${user.profession || "N/A"}
- Income Range: ${user.income_range || "N/A"}
- Financial Goals: ${user.financial_goals || "N/A"}
- Risk Tolerance: ${user.risk_tolerance || "N/A"}
- Communication Style: ${user.communication_style || "N/A"}
- Extra Info: ${user.extra_info || "None"}

Use this profile to personalize tone, advice, and responses.
`;

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: instruction
    });

    console.log(`Instruction (${options.updated ? "updated" : "initial"}) sent to thread ${threadId}`);
  } catch (err) {
    console.error("Error in sendPreInstruction:", err);
  }
}

module.exports = sendPreInstruction;