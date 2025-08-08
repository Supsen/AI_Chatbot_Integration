app.post("/chat", async (req, res) => {
    // 🔍 Destructure input from request body
    let { userId, prompt, threadId } = req.body;

    // ❗ Check if prompt is provided
    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
    }

    // 🧼 Sanitize and format userId (convert to string or null)
    userId = userId ? String(userId) : null;

    // 🧾 Determine if it's a guest user (no userId or starts with "guest_")
    let isGuest = !userId || (typeof userId === "string" && userId.startsWith("guest_"));

    // 👻 If it's a guest, generate a random guest ID
    if (isGuest) {
        console.log("Guest user detected - Creating a new ID...");
        userId = `guest_${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // 🗃️ Only save userId in DB if it's not a guest
    let dbUserId = isGuest ? null : userId;

    // 🧵 Try to get user's thread from the DB, or create a new one if missing
    if (!threadId) {
        threadId = await getUserThread(userId);
    }

    // 🧵 If thread not found, create a new one using OpenAI and save it
    if (!threadId) {
        console.log(`Creating a new thread for ${isGuest ? "Guest" : `User ${userId}`}...`);
        const thread = await openai.beta.threads.create();
        threadId = thread.id;

        // 📝 Save thread in DB (null user for guest)
        await saveUserThread(dbUserId, threadId);
    }

    try {
        // 💬 Add user's prompt to the thread
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: prompt,
        });

        console.log(`Using Thread ID: ${threadId}`);

        // ▶️ Run the assistant on the thread using your ASSISTANT_ID
        const runResponse = await openai.beta.threads.runs.create(threadId, {
            assistant_id: process.env.ASSISTANT_ID,
        });

        // ⏳ Track run status and loop until response is ready
        let status = "in_progress";
        let responseData;
        let attempts = 0;
        const maxAttempts = 30; // ⏲️ Max wait time ~30 seconds

        // 🌀 Poll the status every second until it's done or maxAttempts reached
        while ((status === "in_progress" || status === "queued") && attempts < maxAttempts) {
            console.log(`⏳1. Waiting for response from OpenAI (status: ${status})...`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            responseData = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
            status = responseData.status;
            attempts++;
        }

        // ⛔ Timeout safety net
        if (attempts >= maxAttempts) {
            console.error("⚠️ OpenAI Assistant took too long to respond.");
            return res.status(500).json({ error: "Assistant response timed out." });
        }

        // 🔁 If assistant needs to call a function (tool), handle it
        if (responseData.status === "requires_action" && responseData.required_action?.type === "submit_tool_outputs") {
            const functionCalls = responseData.required_action.submit_tool_outputs?.tool_calls || [];
            let toolOutputs = [];

            // 🛠️ Loop through each function call requested by the assistant
            for (const toolCall of functionCalls) {
                const functionName = toolCall.function.name;
                const functionArgs = JSON.parse(toolCall.function.arguments);

                let functionResponse;

                // 🏦 Match function name and call your own defined helper function
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
                } else {
                    functionResponse = "Unknown function requested.";
                }

                // 📦 Add function result to tool outputs
                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: functionResponse
                });
            }

            // 📤 Submit tool outputs (function results) back to the assistant
            await openai.beta.threads.runs.submitToolOutputs(threadId, runResponse.id, {
                tool_outputs: toolOutputs
            });

            // 🔁 Wait again for the assistant to process the tool output
            status = "in_progress";
            attempts = 0;
            while ((status === "in_progress" || status === "queued") && attempts < maxAttempts) {
                console.log(`⏳2. Waiting for assistant to process function output (status: ${status})...`);
                await new Promise((resolve) => setTimeout(resolve, 1000));
                responseData = await openai.beta.threads.runs.retrieve(threadId, runResponse.id);
                status = responseData.status;
                attempts++;
            }

            // ⛔ Timeout again if it takes too long
            if (attempts >= maxAttempts) {
                console.error("OpenAI Assistant took too long to process function response.");
                return res.status(500).json({ error: "Assistant function processing timed out." });
            }
        }

        // ✅ If everything succeeded, fetch the final response
        if (status === "completed") {
            const messages = await openai.beta.threads.messages.list(threadId);

            // 🧠 Find the latest assistant reply
            const lastMessage = messages.data.find((msg) => msg.role === "assistant");

            if (lastMessage && lastMessage.content.length > 0) {
                // 🎉 Send response back to the frontend
                return res.json({ userId, content: lastMessage.content[0].text.value, threadId });
            } else {
                console.error("Assistant did not return a message.");
                return res.status(500).json({ error: "Assistant did not return a valid response." });
            }
        } else {
            console.error("Assistant run failed.");
            return res.status(500).json({ error: "Assistant run failed." });
        }
    } catch (error) {
        // 🧯 Catch unexpected errors from OpenAI or other parts
        console.error("OpenAI API Error:", error.response ? error.response.data : error);
        return res.status(500).json({ 
            error: error.response?.data?.message || "Failed to fetch response from the assistant." 
        });
    }
});
