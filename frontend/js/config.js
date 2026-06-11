// Global configuration for Placement Portal
// If the app runs on localhost, it will default to the local backend port.
// For production, replace the production URL with your actual deployed Render/Railway backend URL.
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:5000"
  : "https://placement-portal-api.onrender.com"; // <-- Update this with your deployed backend URL

// Export to the window object so it is accessible globally
window.API_BASE_URL = API_BASE_URL;
