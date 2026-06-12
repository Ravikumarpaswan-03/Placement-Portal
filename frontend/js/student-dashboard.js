const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api`;

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

async function loadStudentDashboard() {
  try {
    // Load user info from localStorage
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    const userNameElement = document.getElementById("userName");
    const userEmailElement = document.getElementById("userEmail");

    if (userNameElement) userNameElement.innerText = "Welcome, " + (userName || "Student") + "!";
    if (userEmailElement) userEmailElement.innerText = userEmail || "N/A";

    // Load application stats
    const response = await fetch(`${API_URL}/applications`, {
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("token")
      }
    });

    if (response.ok) {
      const applications = await response.json();
      
      let applied = 0, shortlisted = 0, selected = 0;

      applications.forEach(app => {
        if (app.status === "Applied") applied++;
        else if (app.status === "Shortlisted") shortlisted++;
        else if (app.status === "Selected") selected++;
      });

      const appliedCount = document.getElementById("appliedCount");
      const shortlistedCount = document.getElementById("shortlistedCount");
      const selectedCount = document.getElementById("selectedCount");

      if (appliedCount) appliedCount.innerText = applied;
      if (shortlistedCount) shortlistedCount.innerText = shortlisted;
      if (selectedCount) selectedCount.innerText = selected;
    }
  } catch (error) {
    console.error("Error loading dashboard:", error);
  }
}

// Expose togglePasswordVisibility and toggleAccountSettings to window
window.togglePasswordVisibility = togglePasswordVisibility;
window.toggleAccountSettings = toggleAccountSettings;

function toggleAccountSettings() {
  const card = document.getElementById("accountSettingsCard");
  if (!card) return;
  if (card.style.display === "none" || card.style.display === "") {
    card.style.display = "block";
    card.scrollIntoView({ behavior: "smooth" });
  } else {
    card.style.display = "none";
  }
}

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
  const selfNameInput = document.getElementById("studentSelfName");
  const selfEmailInput = document.getElementById("studentSelfEmail");
  if (selfNameInput) selfNameInput.value = localStorage.getItem("userName") || "";
  if (selfEmailInput) selfEmailInput.value = localStorage.getItem("userEmail") || "";
}

async function handleStudentAccountSettingsSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("studentSelfName").value;
  const email = document.getElementById("studentSelfEmail").value;
  const password = document.getElementById("studentSelfPassword").value;
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
      document.getElementById("studentSelfPassword").value = "";
      loadSelfAccountSettings();
      
      const userNameElement = document.getElementById("userName");
      const userEmailElement = document.getElementById("userEmail");
      if (userNameElement) userNameElement.innerText = "Welcome, " + name + "!";
      if (userEmailElement) userEmailElement.innerText = email;
    } else {
      alert(data.message || "Failed to update settings.");
    }
  } catch (error) {
    console.error("Self update error:", error);
    alert("Error occurred while updating settings.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadStudentDashboard();
  loadSelfAccountSettings();

  const studentAccountSettingsForm = document.getElementById("studentAccountSettingsForm");
  if (studentAccountSettingsForm) {
    studentAccountSettingsForm.addEventListener("submit", handleStudentAccountSettingsSubmit);
  }
});
