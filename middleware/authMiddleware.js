const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;

const authenticateUser = (req, res, next) => {

  if (req.path === "/chat" || req.path === "/api/user") {
    return next(); // Let guests use chat and check user status
  } 

  const token = req.cookies?.token; // Get token from cookies

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.userId = decoded.userId; // Attach userId to request
    next();
  } catch (error) {
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = authenticateUser;