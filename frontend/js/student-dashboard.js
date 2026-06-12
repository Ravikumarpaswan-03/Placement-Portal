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

document.addEventListener("DOMContentLoaded", loadStudentDashboard);
