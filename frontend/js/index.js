const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const AUTH_URL = `${BASE_URL}/api/auth`;
const STATS_URL = `${BASE_URL}/api/dashboard/stats`;

// Tab switcher logic
function switchTab(tab) {
  const loginSection = document.getElementById("loginSection");
  const registerSection = document.getElementById("registerSection");
  const tabBtns = document.querySelectorAll(".tab-btn");

  if (tab === "login") {
    loginSection.classList.add("active");
    registerSection.classList.remove("active");
    tabBtns[0].classList.add("active");
    tabBtns[1].classList.remove("active");
  } else {
    loginSection.classList.remove("active");
    registerSection.classList.add("active");
    tabBtns[0].classList.remove("active");
    tabBtns[1].classList.add("active");
  }
}

// Fetch dashboard stats on load
async function loadStats() {
  try {
    const response = await fetch(STATS_URL);
    if (response.ok) {
      const data = await response.json();
      document.getElementById("students").innerText = data.students || 0;
      document.getElementById("companies").innerText = data.companies || 0;
      document.getElementById("jobs").innerText = data.jobs || 0;
      document.getElementById("applications").innerText = data.applications || 0;
    }
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
  }
}

// Handle User Login
async function loginUser(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role || "student");
      localStorage.setItem("userName", data.name || "User");
      localStorage.setItem("userEmail", data.email || "");

      alert("Login Successful");

      const role = data.role || "student";
      if (role === "admin") {
        window.location.href = "pages/admin-dashboard.html";
      } else if (role === "company") {
        window.location.href = "pages/company-dashboard.html";
      } else if (role === "mentor") {
        window.location.href = "pages/mentor-dashboard.html";
      } else {
        window.location.href = "pages/student-dashboard.html";
      }
    } else {
      alert(data.message || "Login failed.");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login Failed: " + error.message);
  }
}

// Handle User Registration
async function registerUser(event) {
  event.preventDefault();
  const name = document.getElementById("name").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const role = document.getElementById("role").value;

  try {
    const response = await fetch(`${AUTH_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Registration successful. Please log in.");
      switchTab("login");
      // Pre-fill the login email
      document.getElementById("email").value = email;
      event.target.reset();
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Registration Failed: " + error.message);
  }
}

// Attach event handlers
document.addEventListener("DOMContentLoaded", () => {
  loadStats();

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", loginUser);
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", registerUser);
  }
});
