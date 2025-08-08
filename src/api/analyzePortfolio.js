module.exports = (req, res) => {
  const { portfolio, riskTolerance = "moderate" } = req.body;

  if (!Array.isArray(portfolio) || portfolio.length === 0) {
    return res.status(400).json({ error: "Invalid portfolio data." });
  }

  const totalValue = portfolio.reduce((sum, asset) => sum + Number(asset.value || 0), 0);
  if (totalValue === 0) {
    return res.status(400).json({ error: "Portfolio total value is zero." });
  }

  const breakdown = {};
  portfolio.forEach(({ type, value }) => {
    if (!type || isNaN(value)) return;
    const key = type.trim().toLowerCase();
    breakdown[key] = (breakdown[key] || 0) + Number(value);
  });

  const percentBreakdown = {};
  for (const key in breakdown) {
    const percent = (breakdown[key] / totalValue) * 100;
    percentBreakdown[key.charAt(0).toUpperCase() + key.slice(1)] = Math.round(percent);
  }

  // Diversification Score = 10 if balanced and multiple classes, lower if concentrated
  const assetCount = Object.keys(percentBreakdown).length;
  const highWeight = Object.values(percentBreakdown).some(p => p > 70);
  const diversificationScore = assetCount >= 3 && !highWeight ? 9 : assetCount === 2 ? 6 : 3;

  // Risk tolerance vs. actual asset mix
  const crypto = percentBreakdown["Crypto"] || 0;
  const stocks = percentBreakdown["Stock"] || 0;
  const bonds = percentBreakdown["Bond"] || 0;

  let riskMismatch = false;
  if (riskTolerance === "conservative" && crypto > 10) riskMismatch = true;
  if (riskTolerance === "moderate" && crypto > 30) riskMismatch = true;
  if (riskTolerance === "aggressive" && bonds > 50) riskMismatch = true;

  const riskAlignment = riskMismatch ? "Misaligned" : "Aligned";

  res.json({
    total: totalValue,
    breakdown: percentBreakdown,
    diversificationScore,
    riskAlignment,
  });
};