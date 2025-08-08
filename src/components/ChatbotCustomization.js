import React, { useState, useEffect, useCallback } from "react";
import { saveUserPreferences } from "../api/api";
// Fixed import path to ensure case sensitivity is respected
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import "../styles/customization.css";

function ChatbotCustomization({ isOpen, onClose }) {

  // Removed unused isEnabled state
  const [userInfo, setUserInfo] = useState({
    name: "",
    age: "",
    profession: "",
    incomeRange: "",
    financialGoals: "",
    riskTolerance: "",
    extraInfo: "",
    communicationStyle: ""
  });

  // Added form validation state
  const [errors, setErrors] = useState({});
  // Added loading state for better UX
  const [isLoading, setIsLoading] = useState(false);

  // 'risk_tolerance', 'enum(\'Low\',\'Medium\',\'High\')', 'YES', '', 'Medium', ''
  const riskOptions = ["Low", "Medium", "High"];
  const incomeOptions = [
    "--",
    "< $15K",         // Low income / Part-time workers
    "$15K - $30K",    // Entry-level jobs
    "$30K - $50K",    // Low to mid-level professionals
    "$50K - $75K",    // Mid-career professionals
    "$75K - $100K",   // Established professionals
    "$100K - $150K",  // Upper-middle-class earners
    "$150K - $250K",  // High earners
    "$250K - $500K",  // Very high earners
    "$500K - $1M",    // Ultra high-net-worth individuals
    ">$1M"            // Millionaires and above
  ];
  const communicationOptions = ["Formal", "Casual", "Concise", "Detailed"];

  // Moved useEffect before conditional return and memoized with useCallback
  const fetchUserPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/preferences", {
        method: "GET",
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo((prev) => ({
          ...prev,
          ...data,
        }));
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUserPreferences();
    }
  }, [isOpen, fetchUserPreferences]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Added form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!userInfo.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    // Add more validations as needed
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    console.log("📡 Sending data to API:", userInfo); // Log data before sending

    try {
      setIsLoading(true);
  
      // Ensure no undefined values before sending the request
      const cleanedUserInfo = {
        name: userInfo.name.toLowerCase().trim(),
        age: userInfo.age,
        profession: userInfo.profession || null,
        incomeRange: userInfo.incomeRange || null,
        financialGoals: userInfo.financialGoals.toLowerCase() || null,
        riskTolerance: userInfo.riskTolerance.toLowerCase().trim() || "moderate",
        extraInfo: userInfo.extraInfo || null,
        communicationStyle: userInfo.communicationStyle.toLowerCase().trim() || "formal",
      };
  
      console.log("📡 Sent cleaned data to API:", cleanedUserInfo);

      await saveUserPreferences(cleanedUserInfo);
      alert('Preferences saved successfully!');
      onClose();
    } catch (error) {
      alert("Error saving preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  // Return null early if dialog shouldn't be shown
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-content">
        <DialogHeader>
          <DialogTitle className="dialog-title">Customize Chat Assistant</DialogTitle>
          <hr />
          <p className="dialog-subtitle">Introduce yourself to get better, more personalized responses</p>
        </DialogHeader>

        <div className="scrollable-content">
          <div>
            <label htmlFor="name">What should I call you?</label>
            <input 
              id="name"
              type="text"
              name="name"
              placeholder="Name"
              value={userInfo.name}
              onChange={handleChange}
              aria-required="true"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && <div id="name-error" className="field-error">{errors.name}</div>}
          </div>

          <div>
            <label htmlFor="profession">What do you do?</label>
            <input 
              id="profession"
              type="text"
              name="profession"
              placeholder="Profession"
              value={userInfo.profession}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="age">How old are you?</label>
            <input 
              id="age"
              type="number"
              name="age"
              placeholder="Age"
              value={userInfo.age}
              onChange={(e) => setUserInfo(prev => ({ ...prev, age: e.target.value ? parseInt(e.target.value, 10) : "" }))}
              min="0"
              aria-describedby="age-hint"
            />
          </div>

          <h3 className="section-title">Financial Information</h3>

          <div>
            <label htmlFor="incomeRange">What is your income range? (Year)</label>
            <select 
              id="incomeRange" 
              name="incomeRange" 
              value={userInfo.incomeRange} 
              onChange={handleChange}
              className="custom-dropdown"
            >
              <option value="" disabled>Select Income Range</option>
              {incomeOptions.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="financialGoals">What are your financial goals?</label>
            <textarea
              id="financialGoals"
              name="financialGoals"
              placeholder="E.g., Save for retirement, buy a house, invest in stocks..."
              value={userInfo.financialGoals}
              onChange={handleChange}
              className="custom-textarea"
            />
          </div>

          <div>
            <label htmlFor="riskTolerance">What is your risk tolerance?</label>
            <select 
              id="riskTolerance" 
              name="riskTolerance" 
              value={userInfo.riskTolerance} 
              onChange={handleChange}
            >
              <option value="" disabled>Select Risk Tolerance</option>
              {riskOptions.map((risk) => (
                <option key={risk} value={risk}>{risk}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="communicationStyle">What is your preferred communication style?</label>
            <select 
              id="communicationStyle" 
              name="communicationStyle" 
              value={userInfo.communicationStyle} 
              onChange={handleChange}
            >
              <option value="" disabled>Select Communication Style</option>
              {communicationOptions.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          <div>
            <br></br>
            <label htmlFor="extraInfo">Anything else the assistant should know about you?</label>
            <textarea
              id="extraInfo"
              name="extraInfo"
              placeholder="Additional information"
              value={userInfo.extraInfo}
              onChange={handleChange}
              className="custom-textarea"
            />
          </div>
        </div> 

        {/* Added aria-live region for screen readers */}
        {errors.form && (
          <div className="error-message" role="alert" aria-live="polite">
            {errors.form}
          </div>
        )}

        <div className="dialog-buttons">
          <button type="button" onClick={onClose} disabled={isLoading} aria-label="Cancel and close dialog">
            Cancel
          </button>
          <button 
            type="button" 
            className="save-btn" 
            onClick={handleSave} 
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChatbotCustomization;