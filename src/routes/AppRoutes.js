import React from "react";
import MainLayout from "../layouts/MainLayout"; 
import Home from "../pages/Home"; 
import Settings from "../pages/Settings";  
import Profile from "../pages/Profile"; 
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function AppRoutes() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default AppRoutes;