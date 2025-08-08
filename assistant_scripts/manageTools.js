// scripts/manageTools.js
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const assistantId = process.env.ASSISTANT_ID; // Make sure this is set

const tools = [
  {
    type: "function",
    function: {
      name: "getExchangeRate",
      description: "Get exchange rate between two currencies",
      parameters: {
        type: "object",
        properties: {
          from: {
            type: "string",
            description: "Base currency code (e.g. USD, EUR, GBP)"
          },
          to: {
            type: "string",
            description: "Target currency code (e.g. THB, JPY, CAD)"
          }
        },
        required: ["base", "target"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getCryptoPrice",
      description: "Get the latest cryptocurrency price",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Cryptocurrency symbol (e.g. BTC, ETH)"
          }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getStockPrice",
      description: "Get the most recent stock price",
      parameters: {
        type: "object",
        properties: {
          symbol: {
            type: "string",
            description: "Stock ticker symbol (e.g. AAPL, TSLA)"
          }
        },
        required: ["symbol"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculateLoanPayment",
      description: "Calculate monthly loan payment",
      parameters: {
        type: "object",
        properties: {
          loanAmount: {
            type: "number",
            description: "Loan principal amount"
          },
          interestRate: {
            type: "number",
            description: "Annual interest rate (percent)"
          },
          years: {
            type: "number",
            description: "Loan term in years"
          }
        },
        required: ["loanAmount", "interestRate", "years"]
      }
    }
  }
];

// Register tools to your Assistant
async function updateAssistantTools() {
  try {
    const response = await openai.beta.assistants.update(assistantId, {
      tools
    });

    console.log("✅ Tools updated for assistant:");
    console.log(response.tools);
  } catch (error) {
    console.error("❌ Failed to update tools:", error.response?.data || error.message);
  }
}

updateAssistantTools();