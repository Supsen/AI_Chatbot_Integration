const express = require("express");
const router = express.Router();
const analyzePortfolio = require("../src/api/analyzePortfolio");

router.post("/analyzePortfolio", analyzePortfolio);

module.exports = router;