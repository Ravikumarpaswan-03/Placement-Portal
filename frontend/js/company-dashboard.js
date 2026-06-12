const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/dashboard`;

function navigateTo(page) {
  window.location.href = page;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  window.location.href = "../index.html";
}

async function loadDashboard() {
  try {
    const response = await fetch(`${API_URL}/stats`, {
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });
    
    if (!response.ok) {
      throw new Error("Failed to load dashboard stats");
    }

    const data = await response.json();

    const elements = {
      students: document.getElementById("students"),
      companies: document.getElementById("companies"),
      jobs: document.getElementById("jobs"),
      applications: document.getElementById("applications"),
      shortlisted: document.getElementById("shortlisted"),
      placed: document.getElementById("placed")
    };

    if (elements.students) elements.students.innerText = data.students || 0;
    if (elements.companies) elements.companies.innerText = data.companies || 0;
    if (elements.jobs) elements.jobs.innerText = data.jobs || 0;
    if (elements.applications) elements.applications.innerText = data.applications || 0;
    if (elements.shortlisted) elements.shortlisted.innerText = data.shortlisted || 0;
    if (elements.placed) elements.placed.innerText = data.placed || 0;
  } catch (error) {
    console.error(error);
  }
}

// Expose togglePasswordVisibility to window
window.togglePasswordVisibility = togglePasswordVisibility;

function togglePasswordVisibility(inputId, toggleEl) {
  const passwordInput = document.getElementById(inputId);
  if (!passwordInput) return;
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    toggleEl.textContent = "Hide";
  } else {
    passwordInput.type = "password";
    toggleEl.textContent = "Show";
  }
}

function loadSelfAccountSettings() {
  const selfNameInput = document.getElementById("companySelfName");
  const selfEmailInput = document.getElementById("companySelfEmail");
  if (selfNameInput) selfNameInput.value = localStorage.getItem("userName") || "";
  if (selfEmailInput) selfEmailInput.value = localStorage.getItem("userEmail") || "";
}

async function handleCompanyAccountSettingsSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("companySelfName").value;
  const email = document.getElementById("companySelfEmail").value;
  const password = document.getElementById("companySelfPassword").value;
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/update-account`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();
    if (response.ok) {
      alert("Your account credentials updated successfully!");
      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", email);
      document.getElementById("companySelfPassword").value = "";
      loadSelfAccountSettings();
    } else {
      alert(data.message || "Failed to update settings.");
    }
  } catch (error) {
    console.error("Self update error:", error);
    alert("Error occurred while updating settings.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadSelfAccountSettings();

  const companyAccountSettingsForm = document.getElementById("companyAccountSettingsForm");
  if (companyAccountSettingsForm) {
    companyAccountSettingsForm.addEventListener("submit", handleCompanyAccountSettingsSubmit);
  }
});
