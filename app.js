require('dotenv').config(); // Load environment variables first

const express = require('express'); // Import express
const {readdirSync} = require('fs') // import auto route
const cookieParser = require('cookie-parser'); // Import cookie-parser
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const OpenAI = require('openai'); // Import OpenAI

const db = require('./config/db');  // Import database connection
const authRoutes = require('./routes/auth'); // Import auth routes
const userRoutes = require('./routes/userRoutes'); // Import user settings routes
const portfolioRoutes = require('./routes/portfolioRoutes'); // Import portfolio analyzer routes

// // Load environment variables from .env file
const app = express(); // app is initialized BEFORE app.use()
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const ASSISTANT_ID = process.env.ASSISTANT_ID;
// const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

// Middleware
app.use(helmet()); 
app.use(cors({
    origin: "http://localhost:3001",
    credentials: true, // Allow cookies
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));
app.use(bodyParser.json());

// Parse cookies
app.use(cookieParser());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // handled form data

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 20 login attempts per IP
    handler: (req, res) => {
        console.warn(`Rate limit hit for IP: ${req.ip} at ${new Date().toISOString()}`);
        res.status(429).json({ success: false, message: "Too many login attempts. Try again later." });
    },
});
app.use(limiter);

// API Route
app.get("/api/data", (req, res) => {
    res.json({ message: "API is working!" });
});

// Register Authentication Routes AFTER initializing app
app.use("/auth", authRoutes);

// Register User Settings Routes
app.use("/api", userRoutes);
app.use("/api", portfolioRoutes);

// Verify API Key
if (!OPENAI_API_KEY || !COINMARKETCAP_API_KEY || !ASSISTANT_ID) {
    console.error('Error: Missing requirement API_KEY in .env file.');
    process.exit(1);
}

// Helper function to manage user threads
async function getUserThread(userId) {
    // If guest, always create a new thread
    if (!userId || userId.startsWith("guest_")) {
        console.log("Guest detected - Creating a new thread.");
        const thread = await openai.beta.threads.create();
        return thread.id;
    }

    // Ensure proper storage for guests (NULL) and logged-in users
    let dbUserId = userId === "guest" ? null : userId;
    
    // Retrieve thread from DB if it exists
    const [rows] = await db.query("SELECT thread_id FROM threads WHERE user_id IS NULL OR user_id = ?", [dbUserId]);
    return rows.length ? rows[0].thread_id : null;
}

// Save user thread to the database
async function saveUserThread(userId, threadId) {
    // Ensure `userId` is a string and check if it's a guest
    let isGuest = !userId || (typeof userId === "string" && userId.startsWith("guest_"));

    let dbUserId = isGuest ? null : userId; // Guests should store NULL in DB

    if (!isGuest) {
        const [userRows] = await db.query("SELECT id FROM users WHERE id = ?", [dbUserId]);

        if (userRows.length === 0) {
            console.log(`User ${dbUserId} does not exist. Creating new user...`);

            let guestName = isGuest ? `Guest_${dbUserId}` : `Guest_${dbUserId}`; // Fix: Define `isGuest` properly
            await db.query("INSERT INTO users (id, name) VALUES (?, ?)", [dbUserId, guestName]);
        }
    }

    console.log(`Saving thread for ${isGuest ? "Guest" : `User ${dbUserId}`}...`);

    // Insert or update the thread, ensuring NULL for guests
    await db.query(
        "INSERT INTO threads (user_id, thread_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE thread_id = VALUES(thread_id)",
        [dbUserId, threadId]
    );
}

// Function to fetch cryptocurrency price from an external API
async function getCryptoPrice(symbol) {
    try {
        const response = await axios.get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest`, {
            params: { symbol: symbol, convert: "USD" },
            headers: { 'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY }
        });
        const price = response.data.data[symbol].quote.USD.price;
        return `The current price of ${symbol} is **$${price.toFixed(2)} USD**.`;
    } catch (error) {
        console.error("Error fetching crypto price:", error.message);
        return "Sorry, I couldn't fetch the cryptocurrency price at the moment.";
    }
}

// Function to fetch stock price from an external API
async function getStockPrice(symbol) {
    try {
        const response = await axios.get(`http://api.marketstack.com/v1/eod`, {
            params: { 
                access_key: process.env.MARKETSTACK_API_KEY, 
                symbols: symbol 
            }
        });

        if (response.data && response.data.data.length > 0) {
            const stockData = response.data.data[0]; // Most recent EOD price
            return `The last closing price of ${symbol.toUpperCase()} was **$${stockData.close}** on ${stockData.date.split("T")[0]}.`;
        } else {
            return "Stock price data is unavailable.";
        }
    } catch (error) {
        console.error("Error fetching stock price:", error);
        return "Failed to retrieve stock price data.";
    }
}
// Function to fetch exchange rate from frankfurter
async function getCurrencyExchangeRate(base = "USD", target = "THB") {
    try {
      const response = await axios.get("https://api.frankfurter.app/latest", {
        params: { from: base, to: target }
      });
  
      const rate = response.data.rates[target.toUpperCase()];
      return `1 ${base.toUpperCase()} = ${rate.toFixed(2)} ${target.toUpperCase()} (as of ${response.data.date})`;
    } catch (error) {
      console.error(`getCurrencyExchangeRate(${base}, ${target}) failed:`, error.message);
      return `Failed to fetch exchange rate from ${base} to ${target}.`;
    }
}

// Function to calculate monthly loan payment
function calculateLoanPayment(loanAmount, interestRate, years) {
    const monthlyRate = (interestRate / 100) / 12;  // Convert annual rate to monthly
    const months = years * 12; // Convert years to months
    const payment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

    return `For a loan of **$${loanAmount.toFixed(2)}** at an interest rate of **${interestRate}%**, your estimated monthly payment for **${years} years** is **$${payment.toFixed(2)}** per month.`;
}

// Function to fetch weather information
// async function fetchWeather(city) {
//     const apiKey = process.env.WEATHER_API_KEY; // Load from .env
//     const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

//     try {
//         const response = await axios.get(url);
//         if (!response.data) throw new Error("Invalid response from API");

//         return `The current weather in **${response.data.name}** is **${response.data.weather[0].description}** with a temperature of **${response.data.main.temp}°C**.`;
//     } catch (error) {
//         console.error("Error fetching weather:", error);
//         return "Sorry, I couldn't retrieve the weather information at the moment.";
//     }
// }

// ChatGPT Assistant API Endpoint 
app.post("/chat", async (req, res) => {
    let { userId, prompt, threadId } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
    }

    userId = userId ? String(userId) : null; // Ensure userId is a string or null

    // Load customization from user_bot_settings
    let customizationText = "";
    try {
        const [rows] = await db.query(
            "SELECT tone, language, financial_style, persona FROM user_bot_settings WHERE user_id = ?",
            [userId]
        );
        if (rows.length > 0) {
            const { tone, language, financial_style, persona } = rows[0];
            customizationText = `Please respond in a ${tone || "neutral"} tone, in ${language || "English"}, using a ${financial_style || "balanced"} financial style. Act as a ${persona || "professional financial"} advisor.`;
        }
    } catch (err) {
        console.warn("Failed to fetch customization for user:", err.message);
    }
    let isGuest = !userId || (typeof userId === "string" && userId.startsWith("guest_"));

    if (isGuest) {
        console.log("Guest user detected - Creating a new ID...");
        userId = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // Ensure guests get NULL in DB
    let dbUserId = isGuest ? null : userId;

    // Portfolio prompt enhancement
    let insight;
    if (prompt.toLowerCase().includes("portfolio")) {
        try {
            const [portfolioRows] = await db.query(
                "SELECT asset_type, value FROM portfolios WHERE user_id = ?",
                [dbUserId]
            );

            if (portfolioRows.length > 0) {
                const portfolio = portfolioRows.map(r => ({ type: r.asset_type, value: r.value }));
                const analyzePortfolio = require("./api/analyzePortfolio");

                let result;
                const mockReq = { body: { portfolio, riskTolerance: "moderate" } };
                const mockRes = {
                    status: () => ({ json: (data) => { result = data; } }),
                    json: (data) => { result = data; }
                };
                await analyzePortfolio(mockReq, mockRes);

                const breakdownText = Object.entries(result.breakdown)
                    .map(([k, v]) => `${v}% ${k}`)
                    .join(", ");

                insight = `Portfolio Summary:\n- Allocation: ${breakdownText}\n- Diversification Score: ${result.diversificationScore}/10\n- Risk Alignment: ${result.riskAlignment}\n\n`;
            }
        } catch (e) {
            console.warn("Portfolio injection failed:", e.message);
        }
    }

    // Inject customization and portfolio insight into the prompt
    prompt = customizationText + "\n\n" + (typeof insight !== "undefined" ? insight : "") + prompt;

    // Retrieve thread from DB if exists
    if (!threadId) {
        threadId = await getUserThread(userId);
    }

    if (!threadId) {
        console.log(`Creating a new thread for ${isGuest ? "Guest" : `User ${userId}`}...`);
        const thread = await openai.beta.threads.create();
        threadId = thread.id;

        // Save thread with NULL for guests
        await saveUserThread(dbUserId, threadId);
    }

    try {
        // Add the user's message to the thread
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: prompt,
        });
        console.log(`Using Thread ID: ${threadId}`);
        // Run the assistant on the thread
        const runResponse = await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID,
        });

        let status = "in_progress";
        let responseData;
        let attempts = 0;
        const maxAttempts = 30; // Prevent infinite loops (Max 30 seconds)

        // Poll for assistant response
        while ((status === "in_progress" || status === "queued") && attempts < maxAttempts) {
            console.log(`⏳1. Waiting for response from OpenAI (status: ${status})...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            responseData = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
            status = responseData.status;
            attempts++;
        }

        // Timeout protection
        if (attempts >= maxAttempts) {
            console.error("⚠️ OpenAI Assistant took too long to respond.");
            return res.status(500).json({ error: "Assistant response timed out." });
        }

        // Handle function calls if required
        if (responseData.status === "requires_action" && responseData.required_action?.type === "submit_tool_outputs") {
            const functionCalls = responseData.required_action.submit_tool_outputs?.tool_calls || [];
            let toolOutputs = [];

            for (const toolCall of functionCalls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

                let functionResponse;
                if (functionName === "getStockPrice") {
                    functionResponse = await getStockPrice(functionArgs.symbol);
                } else if (functionName === "getCryptoPrice") {
                    functionResponse = await getCryptoPrice(functionArgs.symbol);
                } else if (functionName === "calculateLoanPayment") {
                    functionResponse = calculateLoanPayment(
                        functionArgs.loanAmount, 
                        functionArgs.interestRate, 
                        functionArgs.years
                    );
                } else if (functionName === "getExchangeRate") {
                    functionResponse = await getCurrencyExchangeRate(
                      functionArgs.from || "USD",
                      functionArgs.to || "THB"
                    );
                } else {
                    functionResponse = "Unknown function requested.";
                }

                // Add function output
                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: functionResponse
                });
            }

            // Submit function outputs back to OpenAI
            await openai.beta.threads.runs.submitToolOutputs(threadId, runResponse.id, { tool_outputs: toolOutputs });

            // Wait for assistant to process function response
            status = "in_progress";
            attempts = 0;
            while ((status === "in_progress" || status === "queued") && attempts < maxAttempts) {
                console.log(`2. Waiting for assistant to process function output (status: ${status})...`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                responseData = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
                status = responseData.status;
                attempts++;
            }

            if (attempts >= maxAttempts) {
                console.error("OpenAI Assistant took too long to process function response.");
                return res.status(500).json({ error: "Assistant function processing timed out." });
            }
        }

        // Retrieve assistant response
        if (status === "completed") {
            const messages = await openai.beta.threads.messages.list(threadId);
            const lastMessage = messages.data.find((msg) => msg.role === "assistant");

            if (lastMessage && lastMessage.content.length > 0) {
                console.log("Assistant response:", lastMessage.content[0].text.value);
                // (No change to returned JSON, but logging now matches the alert in frontend)
                return res.json({ userId, content: lastMessage.content[0].text.value, threadId });
            } else {
                console.error("Assistant did not return a message.");
                return res.status(500).json({ error: "Assistant did not return a valid response." });
            }
        } else {
            console.error("Assistant run failed.");
            return res.status(500).json({ error: "Assistant run failed." });
        }
    } catch (err) {
        console.error("Error:", err.response?.data || err.message);
        return res.status(500).json({ error: "Failed to send portfolio to chat." });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Handle specific error types
    if (err.response) {
        // Errors from external API calls
        res.status(err.response.status).json({ error: err.response.data });
    } else if (err.name === 'ValidationError') {
        // Example of a custom error type
        res.status(400).json({ error: err.message });
    } else {
        // General server errors
        res.status(500).send('Something went wrong!');
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


