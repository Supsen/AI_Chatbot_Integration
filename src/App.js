import React, { useEffect, useState } from "react";
import { getData } from "./api/api.js";
import axios from "axios";
import "./styles/dropdown.css";
import ChatbotCustomization from "./components/ChatbotCustomization";
import ProfileEditModal from "./components/ProfileEditModal.jsx";
import PortfolioAnalyzer from "./components/PortfolioAnalyzer.jsx";

function App() {
  const [data, setData] = useState(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [theme, setTheme] = useState("light-mode");
  const [username, setUsername] = useState("Guest");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);

  console.log("🚀 Rendering App component...");

  const logoutUser = async () => {
    try {
      const response = await fetch("/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        console.log("Logged out successfully!");

        localStorage.removeItem("threadId");
        localStorage.removeItem("username");
        localStorage.setItem("username", "guest_user");
        localStorage.removeItem("userId");

        setUsername("Guest");
        setIsLoggedIn(false);

        window.location.href = "/";
      } else {
        console.error("Logout failed.");
      }
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light-mode";
    setTheme(savedTheme);
    document.body.classList.add(savedTheme === "light" ? "light-mode" : "dark-mode");
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getData();
        setData(response);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get("/api/user", { withCredentials: true });
        if (response.data.user) {
          setUsername(response.data.user.name);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.log("👤 Guest detected - No logged-in user.");
        setIsLoggedIn(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const openPopup = () => {
      console.log("Opening chatbot customization!");
      setIsChatbotOpen(true);
    };

    window.addEventListener("openChatbotCustomization", openPopup);

    return () => {
      console.log("Cleaning up event listener...");
      window.removeEventListener("openChatbotCustomization", openPopup);
    };
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      console.log("File contents:", contents);
      // TODO: parse and analyze portfolio data
    };
    reader.readAsText(file);
  };

  return (
    <>
      <ChatbotCustomization isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />
      <ProfileEditModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
      <PortfolioAnalyzer isOpen={isPortfolioModalOpen} onClose={() => setIsPortfolioModalOpen(false)} />

      <button className="profile-btn" id="profileBtn" title="profile" onClick={toggleDropdown}>
        <i className="fas fa-user"></i>
      </button>

      <div className={`profileDropdown ${isDropdownOpen ? "active" : ""}`}>
        {isLoggedIn ? (
          <>
            <div id="customizeChatbotBtn" onClick={() => setIsChatbotOpen(true)} className="clickable">
              <i className="fas fa-cogs"></i> Customize ChatBot
            </div>
            <div className="clickable" onClick={() => setIsPortfolioModalOpen(true)}>
              <i className="fas fa-chart-line"></i> Portfolio Analyzer
            </div>
            <div id="profileEditBtn" onClick={() => setIsProfileModalOpen(true)} className="clickable">
              <i className="fas fa-user-edit"></i> {username}
            </div>
            <div id="logoutBtn" onClick={logoutUser} className="logout-button">
              <i className="fas fa-sign-out-alt"></i> Logout
            </div>
          </>
        ) : (
          <div id="loginBtn" onClick={() => (window.location.href = "registration2.html")} className="login-button">
            <i className="fas fa-sign-in-alt"></i> Login
          </div>
        )}
      </div>
    </>
  );
}

export default App;