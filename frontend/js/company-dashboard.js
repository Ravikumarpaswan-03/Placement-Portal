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
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "../index.html";
    return;
  }

  try {
    const response = await fetch(`${API_URL}/stats`, {
      headers: {
        "Authorization": "Bearer " + token
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

  // Fetch company analytics for pipeline chart
  try {
    const analyticsResponse = await fetch(`${BASE_URL}/api/analytics/dashboard-data`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      const dist = analyticsData.applicationDistribution || {};
      
      const applied = dist.Applied || 0;
      const shortlisted = dist.Shortlisted || 0;
      const selected = dist.Selected || 0;
      const rejected = dist.Rejected || 0;

      const ctx = document.getElementById("analyticsChart");
      if (ctx) {
        new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Applied", "Shortlisted", "Selected", "Rejected"],
            datasets: [{
              label: "Applications Received",
              data: [applied, shortlisted, selected, rejected],
              backgroundColor: [
                "rgba(99, 102, 241, 0.7)",  // indigo
                "rgba(167, 139, 250, 0.7)", // purple
                "rgba(16, 185, 129, 0.7)",  // green
                "rgba(239, 68, 68, 0.7)"    // red
              ],
              borderColor: [
                "rgba(99, 102, 241, 1)",
                "rgba(167, 139, 250, 1)",
                "rgba(16, 185, 129, 1)",
                "rgba(239, 68, 68, 1)"
              ],
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "bottom",
                labels: { color: "#f3f4f6" }
              }
            }
          }
        });
      }
    }
  } catch (err) {
    console.error("Error rendering company chart:", err);
  }
}

// Expose togglePasswordVisibility and toggleAccountSettings to window
window.togglePasswordVisibility = togglePasswordVisibility;
window.toggleAccountSettings = toggleAccountSettings;
window.deleteSelfAccount = deleteSelfAccount;

async function deleteSelfAccount() {
  if (!confirm("Are you sure you want to permanently delete your company recruiter account? This action cannot be undone and will delete all your records, job postings, and applications.")) {
    return;
  }
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${BASE_URL}/api/auth/delete-account`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (response.ok) {
      alert("Your recruiter account has been successfully deleted.");
      localStorage.clear();
      window.location.href = "../index.html";
    } else {
      const data = await response.json();
      alert(data.message || "Failed to delete account.");
    }
  } catch (error) {
    console.error("Delete self error:", error);
    alert("Error occurred while deleting your account.");
  }
}

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
