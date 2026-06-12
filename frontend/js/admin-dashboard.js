const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/dashboard`;

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

async function handleAddAdminSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("adminName").value;
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ name, email, password, role: "admin" })
    });

    const data = await response.json();
    if (response.ok) {
      alert("Administrator account created successfully!");
      event.target.reset();
    } else {
      alert(data.message || "Failed to create administrator account.");
    }
  } catch (error) {
    console.error("Add admin error:", error);
    alert("Error occurred while creating administrator account.");
  }
}

async function handleAdminResetUserPasswordSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("resetUserEmail").value;
  const newPassword = document.getElementById("resetUserPassword").value;
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ email, newPassword })
    });

    const data = await response.json();
    if (response.ok) {
      alert(`Password for ${email} has been reset successfully!`);
      event.target.reset();
    } else {
      alert(data.message || "Failed to reset user password.");
    }
  } catch (error) {
    console.error("Admin reset user password error:", error);
    alert("Error occurred while resetting user password.");
  }
}

async function handleAssignPermissionsSubmit(event) {
  event.preventDefault();
  const email = document.getElementById("assignEmail").value;
  const canCreateAdmin = document.getElementById("assignCanCreateAdmin").checked;
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/assign-permission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ email, canCreateAdmin })
    });

    const data = await response.json();
    if (response.ok) {
      alert(`Privileges updated successfully for ${email}!`);
      event.target.reset();
    } else {
      alert(data.message || "Failed to update privileges.");
    }
  } catch (error) {
    console.error("Assign privileges error:", error);
    alert("Error occurred while updating privileges.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  
  const addAdminForm = document.getElementById("addAdminForm");
  if (addAdminForm) {
    addAdminForm.addEventListener("submit", handleAddAdminSubmit);
  }

  const resetUserPasswordForm = document.getElementById("resetUserPasswordForm");
  if (resetUserPasswordForm) {
    resetUserPasswordForm.addEventListener("submit", handleAdminResetUserPasswordSubmit);
  }

  // Display the privilege delegation UI card only if the logged-in user is the Master Admin
  const userEmail = localStorage.getItem("userEmail");
  if (userEmail === "ravikumarofficial8459@gmail.com") {
    const assignCard = document.getElementById("assignPermissionsCard");
    if (assignCard) {
      assignCard.style.display = "block";
    }
  }

  const assignPermissionsForm = document.getElementById("assignPermissionsForm");
  if (assignPermissionsForm) {
    assignPermissionsForm.addEventListener("submit", handleAssignPermissionsSubmit);
  }
});
