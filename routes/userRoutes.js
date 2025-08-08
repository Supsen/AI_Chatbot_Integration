const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { getUserPreferences } = require("../controllers/authController"); 
const authenticateUser = require("../middleware/authMiddleware"); 
const sendPreInstruction = require("../controllers/sendInstruction");

// Route to Fetch User Preferences (Protected)
router.get("/user/preferences", authenticateUser, getUserPreferences);

// Fetch user details
router.get("/user", authenticateUser, async (req, res) => {
  try {
    const userId = req.userId; // Extracted from JWT token by middleware

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is missing" });
    }

    // Fetch user from the database
    const [user] = await db.execute("SELECT id, name, email FROM users WHERE id = ?", [userId]);

    if (!user.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: user[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Save or Update Chatbot Preferences (Protected)
router.post('/saveUserPreferences', authenticateUser, async (req, res) => {
  console.log("Middleware passed, Processing Request...");  // Debugging Log

  const userId = req.userId; 

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is missing (Error from userRoutes)" });
  } 

  // 🛠 Debugging: Log userId
  console.log("userRoutes.js: Received User ID from Token:", userId);
  console.log("userRoutes.js: Received user data:", req.body); // Log user data

  const {
    name, 
    age,
    profession,
    incomeRange,  
    financialGoals,  
    extraInfo,  
    riskTolerance,  
    communicationStyle  
} = req.body;

  const cleanedValues = {
    userId: userId,
    nickname: name || null,  // Fix: Use `name` for nickname
    age: age || null,
    profession: profession || null,
    income_range: incomeRange || null,  // Fix: Use correct variable
    financial_goals: financialGoals || null,  // Fix: Use correct variable
    extra_info: extraInfo || null,  // Fix: Use correct variable
    risk_tolerance: riskTolerance || "medium",  // Fix: Use correct variable
    communication_style: communicationStyle || "casual"  // Fix: Use correct variable
  };

  // Debug after transformation
  console.log("Final cleaned values before inserting into DB:", cleanedValues);

  const values = Object.values(cleanedValues); // Convert object to array for MySQL

  const query = `
    INSERT INTO user_bot_settings (
      user_id, nickname, age, profession, income_range,
      financial_goals, extra_info, risk_tolerance, communication_style
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      nickname = VALUES(nickname),
      age = VALUES(age),
      profession = VALUES(profession),
      income_range = VALUES(income_range),
      financial_goals = VALUES(financial_goals),
      extra_info = VALUES(extra_info),
      risk_tolerance = VALUES(risk_tolerance),
      communication_style = VALUES(communication_style)
  `;

  try {
    await db.execute(query, values);
    console.log("Preferences saved to database.");

    try {
      const [threadRow] = await db.query("SELECT thread_id FROM threads WHERE user_id = ?", [userId]);

      if(threadRow.length > 0) {
        const threadId = threadRow[0].thread_id;
        await sendPreInstruction(threadId, userId, { updated: true }); // updated flag
        console.log("Updated instruction sent to assistant thread.");
      } else {
        console.log("No thread found for user - skipping instruction update.");
      }
    } catch (err) {
      console.log("Failed to send updated instruction:", err);
    }

    res.status(200).json({ success: true, message: "Preferences saved successfully." });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, message: "Failed to save preferences." });
  }
});

module.exports = router;