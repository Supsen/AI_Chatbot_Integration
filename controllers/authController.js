const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const sendEmail = require("../utils/sendEmail");
const secretKey = process.env.JWT_SECRET;

// Function to handle user registration
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
        }

        // 🔹 Check if user already exists
        const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email.trim()]);
        if (existingUser.length > 0) {
            return res.status(400).json({ success: false, message: "Email is already registered!" });
        }

        // 🔹 Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);

        // 🔹 Insert user into database
        const [result] = await db.query("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
            name.trim(),
            email.trim(),
            hashedPassword
        ]);

        if (result.affectedRows > 0) {
            console.log(`User registered: ${email}`);

            // Generate JWT Token immediately after registering
            const token = jwt.sign({ userId: result.insertId, username: name }, secretKey, { expiresIn: "1h" });

            // Store token in a cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "Strict"
            });

            return res.status(201).json({ 
                success: true, 
                message: "User registered successfully!", 
                user: { id: result.insertId, name }  // Send back user ID
            });
        } else {
            return res.status(500).json({ success: false, message: "Failed to register user." });
        }

    } catch (error) {
        console.error("Registration Error:", error);
        return res.status(500).json({ success: false, message: "Server error! Please try again later." });
    }
};

// Function to handle user login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required!" });
        }

        // Check if the user exists
        const [userRows] = await db.query("SELECT * FROM users WHERE email = ?", [email.trim()]);
        if (userRows.length === 0) {
            console.error("Login Error: User not found for email:", email);
            return res.status(401).json({ success: false, message: "Invalid email or password!" });
        }

        const user = userRows[0];

        // Compare the password securely
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.error("Login Error: Incorrect password for user:", email);
            return res.status(401).json({ success: false, message: "Invalid email or password!" });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, username: user.name }, secretKey, { expiresIn: "1h" });

        // Set the token in HTTP only cookie for security
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict"
        });

        // Return success response
        res.status(200).json({ success: true, message: "Login successful!", user: { id: user.id, name: user.name } });

    } catch (error) {
        console.error("Login Server Error:", error);
        res.status(500).json({ success: false, message: "Server error! Please try again later." });
    }
};

// Get user bot'setttings 
const getUserPreferences = async (req, res) => {
    try {
        const userId = req.userId; // Use req.userId set by middleware

        if (!userId) {
            return res.status(400).json({ success: false, message: "User ID is missing" });
        }

        const [rows] = await db.execute("SELECT * FROM user_bot_settings WHERE user_id = ?", [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const dbUser = rows[0];

        const mappedUser = {
            name: dbUser.nickname || "",
            age: dbUser.age || "",
            profession: dbUser.profession || "",
            incomeRange: dbUser.income_range || "",
            financialGoals: dbUser.financial_goals || "",
            extraInfo: dbUser.extra_info || "",
            riskTolerance: dbUser.risk_tolerance || "",
            communicationStyle: dbUser.communication_style || ""
        };
        res.json(mappedUser); // Return user preferences
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// Reset password route
const crypto = require("crypto");

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if(!email) {
        return res.status(400).json({success: false, message: "Email not found! Please try again."});
    }

    const [userRows] = await db.query("SELECT * FROM users WHERE email = ?", [email.trim()]);
    if (userRows.length === 0) {
        return res.status(400).json({ success: false, message: "User not found." });
    }
    const user = userRows[0];  

    // Generate a token (you can also use JWT here if you want)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Set expiration to 1 hour
    const expires = new Date(Date.now() + 3600000); // 1 hour

    // Save token & expiry to DB (add these field to your users table)
    await db.query(
        "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
        [resetToken, expires, user.id]
    );

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

    await sendEmail({
        to: email,
        subject: "Password Reset Request",
        text: `Click the link to reset your password:\n\n${CLIENT_URL}/reset_password.html?token=${resetToken}`
    });

    res.json({ success: true, message: "Password reset link sent to your email." });
}

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ success: false, message: "Token and new password are required." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    // Check if token is valid & not expired
    const [userRows] = await db.query(
        "SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > NOW()",
        [token]
    );

    if (userRows.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    const user = userRows[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password & clear reset token
    await db.query(
        "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?",
        [hashedPassword, user.id]
    );

    res.json({ success: true, message: "Password has been reset successfully!" });
};

// User logout clear cookie
const logout = async (req, res) => {
    // Clear JWT cookie
    res.clearCookie("token", {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: "Strict",
        path: "/", // Ensure it clears the correct cookie path
        domain: process.env.COOKIE_DOMAIN || "localhost" // Adjust for production
    });

    res.status(200).json({ success: true, message: "Logged out successfully!" });
};

module.exports = { registerUser, loginUser, logout, getUserPreferences, requestPasswordReset, resetPassword };