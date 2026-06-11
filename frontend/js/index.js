const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const AUTH_URL = `${BASE_URL}/api/auth`;
const STATS_URL = `${BASE_URL}/api/dashboard/stats`;

// Tab switcher logic
let verificationEmail = "";

function switchTab(tab) {
  const loginSection = document.getElementById("loginSection");
  const registerSection = document.getElementById("registerSection");
  const otpSection = document.getElementById("otpSection");
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabsContainer = document.querySelector(".tabs");

  if (tabsContainer) {
    tabsContainer.style.display = "flex";
  }
  if (otpSection) {
    otpSection.classList.remove("active");
  }

  if (tab === "login") {
    if (loginSection) loginSection.classList.add("active");
    if (registerSection) registerSection.classList.remove("active");
    tabBtns[0].classList.add("active");
    tabBtns[1].classList.remove("active");
  } else {
    if (loginSection) loginSection.classList.remove("active");
    if (registerSection) registerSection.classList.add("active");
    tabBtns[0].classList.remove("active");
    tabBtns[1].classList.add("active");
  }
}

function showVerification(email) {
  verificationEmail = email;
  const targetEmailEl = document.getElementById("otpTargetEmail");
  if (targetEmailEl) {
    targetEmailEl.innerText = email;
  }

  const loginSection = document.getElementById("loginSection");
  const registerSection = document.getElementById("registerSection");
  const otpSection = document.getElementById("otpSection");
  const tabsContainer = document.querySelector(".tabs");

  if (tabsContainer) {
    tabsContainer.style.display = "none";
  }
  if (loginSection) loginSection.classList.remove("active");
  if (registerSection) registerSection.classList.remove("active");
  if (otpSection) otpSection.classList.add("active");
  
  const codeEl = document.getElementById("otpCode");
  if (codeEl) {
    codeEl.value = "";
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
      if (data.needsVerification && data.email) {
        alert(data.message || "Verification required.");
        showVerification(data.email);
      } else {
        alert(data.message || "Login failed.");
      }
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
      alert("Registration successful. Please verify your email with the OTP sent to " + email);
      showVerification(email);
      event.target.reset();
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch (error) {
    console.error("Registration error:", error);
    alert("Registration Failed: " + error.message);
  }
}

// Handle OTP Verification Submit
async function verifyOtp(event) {
  event.preventDefault();
  const otp = document.getElementById("otpCode").value;

  try {
    const response = await fetch(`${AUTH_URL}/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: verificationEmail, otp })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.role || "student");
      localStorage.setItem("userName", data.name || "User");
      localStorage.setItem("userEmail", data.email || "");

      alert("Email verified and Login Successful");

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
      alert(data.message || "Verification failed.");
    }
  } catch (error) {
    console.error("Verification error:", error);
    alert("Verification Failed: " + error.message);
  }
}

// Handle OTP Resend Link
async function resendOtp(event) {
  if (event) event.preventDefault();
  try {
    const response = await fetch(`${AUTH_URL}/resend-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: verificationEmail })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Verification code resent successfully.");
      const codeEl = document.getElementById("otpCode");
      if (codeEl) {
        codeEl.value = "";
      }
    } else {
      alert(data.message || "Failed to resend OTP.");
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    alert("Resend OTP Failed: " + error.message);
  }
}

// Cancel OTP Verification
function cancelOtp(event) {
  if (event) event.preventDefault();
  const tabsContainer = document.querySelector(".tabs");
  if (tabsContainer) {
    tabsContainer.style.display = "flex";
  }
  const otpSection = document.getElementById("otpSection");
  if (otpSection) {
    otpSection.classList.remove("active");
  }
  switchTab("login");
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

  const otpForm = document.getElementById("otpForm");
  if (otpForm) {
    otpForm.addEventListener("submit", verifyOtp);
  }
});
