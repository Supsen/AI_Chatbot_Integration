import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import axios from "axios";
import PortfolioChart from "./PortfolioChart.jsx";

const PortfolioAnalyzer = ({ isOpen, onClose }) => {
  const [portfolio, setPortfolio] = useState([
    { type: "Stock", value: "" },
    { type: "Bond", value: "" },
    { type: "Crypto", value: "" },
  ]);
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (idx, field, value) => {
    const updated = [...portfolio];
    updated[idx][field] = value;
    setPortfolio(updated);
  };

  const addRow = () => setPortfolio([...portfolio, { type: "", value: "" }]);
  const removeRow = (idx) => setPortfolio(portfolio.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError("");
    console.log("Analyzing portfolio...", portfolio);
    const cleaned = portfolio.filter(p => p.type && Number(p.value) > 0);
    if (cleaned.length === 0) {
      setError("Please enter at least one valid asset.");
      return;
    }

    console.log("Analyzing portfolio...", cleaned);
    // Remove old alert and add visual feedback to chat UI
    window.dispatchEvent(new CustomEvent("newChatbotReply", { detail: "Analyzing your portfolio..." }));

    const total = cleaned.reduce((sum, p) => sum + Number(p.value), 0);
    const summary = cleaned.map(p => `${Math.round((p.value / total) * 100)}% ${p.type}`).join(", ");
    const message = `Here is my portfolio: ${summary}. My risk tolerance is ${riskTolerance}. Please analyze my portfolio based on my financial profile and preferences.`;

    try {
      const response = await axios.post("/chat", {
        userId: localStorage.getItem("userId") || "guest_user",
        prompt: message,
      });

      const content = response.data.content;
      console.log("Assistant response:", content);

      // Dispatch chatbot reply event to be caught by main chat UI
      window.dispatchEvent(new CustomEvent("newChatbotReply", { detail: content }));
      onClose();
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      setError("Failed to send portfolio to chat.");
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{ background: "#fff", padding: "2rem", borderRadius: "8px", width: "700px", maxHeight: "90vh", overflowY: "auto" }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            float: "right",
            color: "black",
            cursor: "pointer"
          }}
        >
          <IoClose size={24} />
        </button>
        <h2 style={{ color: "black" }}>Portfolio Analyzer</h2>

        <label style={{ color: "black" }}>
          Risk Tolerance:
          <select value={riskTolerance} onChange={e => setRiskTolerance(e.target.value)} style={{ marginLeft: "1rem" }}>
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </label>

        <table style={{ width: "100%", marginTop: "1rem" }}>
          <thead>
            <tr>
              <th style={{ color: "black" }}>Asset Type</th>
              <th style={{ color: "black" }}>Value (USD)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((item, idx) => (
              <tr key={idx}>
                <td><input value={item.type} onChange={e => handleChange(idx, "type", e.target.value)} /></td>
                <td><input type="number" value={item.value} onChange={e => handleChange(idx, "value", e.target.value)} /></td>
                <td>
                  <button
                    onClick={() => removeRow(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "black",
                      cursor: "pointer"
                    }}
                  >
                    <IoClose size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button onClick={addRow}>+ Add Asset</button>
        <button onClick={handleSubmit} style={{ marginLeft: "1rem" }}>Analyze</button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {portfolio.length > 0 && (
            <div className="mt-6">
                <h4 style={{ color: "black", marginBottom: "0.5rem" }}>Asset Allocation</h4>
                <PortfolioChart data={portfolio} />
            </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAnalyzer;