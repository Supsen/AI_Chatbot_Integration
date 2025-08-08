import axios from "axios";

export const getData = async () => {
  try {
    const response = await axios.get("/api/data", { withCredentials: true }); // Uses Webpack Proxy
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response ? error.response.data : error.message);
    return null;
  }
};

// New: Save user preferences to the database
export const saveUserPreferences = async (preferences) => {
  try {
    const response = await axios.post("/api/saveUserPreferences", preferences, {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response ? error.response.data : error.message);
    throw error;
  }
};

// Login API (stores token in cookies)
export const login = async (username, password) => {
  try {
    const response = await axios.post("/auth/login", { username, password }, { 
      withCredentials: true 
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout API (clears cookie)
export const logout = async () => {
  await axios.post("/auth/logout", {}, { withCredentials: true });
};