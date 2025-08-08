
const express = require("express");
const router = express.Router();
const { requestPasswordReset, resetPassword } = require("../controllers/authController");
const { registerUser, loginUser, logout } = require("../controllers/authController"); // Import controllers

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);

module.exports = router;