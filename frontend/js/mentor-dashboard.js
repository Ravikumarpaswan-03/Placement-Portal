const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const STATS_URL = `${BASE_URL}/api/dashboard/stats`;
const APP_URL = `${BASE_URL}/api/applications`;

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  window.location.href = "../index.html";
}

function getBadgeClass(status) {
  switch (status) {
    case "Applied":
      return "badge-applied";
    case "Shortlisted":
    case "Interview":
    case "Interview Scheduled":
      return "badge-shortlisted";
    case "Selected":
    case "Offer":
      return "badge-placed";
    case "Rejected":
      return "badge-rejected";
    default:
      return "badge-applied";
  }
}

async function loadDashboard() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  // 1. Fetch statistics
  try {
    const response = await fetch(STATS_URL);
    if (response.ok) {
      const data = await response.json();
      document.getElementById("students").innerText = data.students || 0;
      document.getElementById("placed").innerText = data.placed || 0;
      document.getElementById("jobs").innerText = data.jobs || 0;
      document.getElementById("shortlisted").innerText = data.shortlisted || 0;
    }
  } catch (error) {
    console.error("Failed to load statistics:", error);
  }

  // 2. Fetch all applications for review
  try {
    const response = await fetch(APP_URL, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (response.ok) {
      const applications = await response.json();
      const reportBody = document.getElementById("applicationReport");
      
      if (!applications || applications.length === 0) {
        reportBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #9ca3af;">No applications have been submitted yet.</td></tr>`;
        return;
      }

      reportBody.innerHTML = applications
        .map(app => {
          const appliedDate = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "N/A";
          const badgeClass = getBadgeClass(app.status);
          return `
            <tr>
              <td><strong>${app.studentName}</strong></td>
              <td>${app.jobTitle}</td>
              <td><span class="badge ${badgeClass}">${app.status}</span></td>
              <td>${appliedDate}</td>
            </tr>
          `;
        })
        .join("");
    }
  } catch (error) {
    console.error("Failed to load applications:", error);
    const reportBody = document.getElementById("applicationReport");
    if (reportBody) {
      reportBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Unable to load application progress reports.</td></tr>`;
    }
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
  const selfNameInput = document.getElementById("mentorSelfName");
  const selfEmailInput = document.getElementById("mentorSelfEmail");
  if (selfNameInput) selfNameInput.value = localStorage.getItem("userName") || "";
  if (selfEmailInput) selfEmailInput.value = localStorage.getItem("userEmail") || "";
}

async function handleMentorAccountSettingsSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("mentorSelfName").value;
  const email = document.getElementById("mentorSelfEmail").value;
  const password = document.getElementById("mentorSelfPassword").value;
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
      document.getElementById("mentorSelfPassword").value = "";
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

  const mentorAccountSettingsForm = document.getElementById("mentorAccountSettingsForm");
  if (mentorAccountSettingsForm) {
    mentorAccountSettingsForm.addEventListener("submit", handleMentorAccountSettingsSubmit);
  }
});
