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

  // Load analytics data for charts
  try {
    const analyticsResponse = await fetch(`${BASE_URL}/api/analytics/dashboard-data`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      
      // 1. Render Application Status Chart
      const dist = analyticsData.applicationDistribution || {};
      const applied = dist.Applied || 0;
      const shortlisted = dist.Shortlisted || 0;
      const selected = dist.Selected || 0;
      const rejected = dist.Rejected || 0;

      const ctx1 = document.getElementById("analyticsChart");
      if (ctx1) {
        new Chart(ctx1, {
          type: "doughnut",
          data: {
            labels: ["Applied", "Shortlisted", "Selected (Placed)", "Rejected"],
            datasets: [{
              label: "Applications",
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

      // 2. Render Student Skills Distribution Bar Chart
      const topSkills = analyticsData.topSkills || [];
      const skillLabels = topSkills.map(item => item.skill);
      const skillData = topSkills.map(item => item.count);

      const ctx2 = document.getElementById("skillsChart");
      if (ctx2) {
        new Chart(ctx2, {
          type: "bar",
          data: {
            labels: skillLabels.length > 0 ? skillLabels : ["No Skills Logged"],
            datasets: [{
              label: "Students Count",
              data: skillData.length > 0 ? skillData : [0],
              backgroundColor: "rgba(167, 139, 250, 0.7)",
              borderColor: "rgba(167, 139, 250, 1)",
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: {
                ticks: { color: "#9ca3af" },
                grid: { color: "rgba(255, 255, 255, 0.05)" }
              },
              y: {
                beginAtZero: true,
                ticks: { color: "#9ca3af", stepSize: 1 },
                grid: { color: "rgba(255, 255, 255, 0.05)" }
              }
            }
          }
        });
      }
    }
  } catch (error) {
    console.error("Error loading admin charts:", error);
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
      loadUsers();
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
  const userId = document.getElementById("resetUserId")?.value || undefined;
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
      body: JSON.stringify({ userId, email, newPassword })
    });

    const data = await response.json();
    if (response.ok) {
      alert(`Password for ${email} has been reset successfully!`);
      event.target.reset();
      document.getElementById("resetUserId").value = "";
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

async function loadUsers() {
  const token = localStorage.getItem("token");
  const currentUserEmail = localStorage.getItem("userEmail");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/users`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!response.ok) throw new Error("Failed to load users list");

    const users = await response.json();
    const listElement = document.getElementById("userCredentialsList");
    if (!listElement) return;

    if (!users || users.length === 0) {
      listElement.innerHTML = `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #9ca3af;">No users found.</td></tr>`;
      return;
    }

    // Save users globally for quick lookup by email in login attempts list
    window.usersList = users;

    listElement.innerHTML = users.map(user => {
      const isTargetAdmin = user.role === "admin";
      const isMasterAdmin = currentUserEmail === "ravikumarofficial8459@gmail.com";
      const isMasterAdminAccount = user.email === "ravikumarofficial8459@gmail.com";
      const canModify = (!isTargetAdmin || isMasterAdmin) && !isMasterAdminAccount;

      const editBtn = canModify
        ? `<button onclick="editUserCredentials('${user._id}', '${user.name.replace(/'/g, "\\'")}', '${user.email}')" style="background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%); font-size: 0.8rem; padding: 6px 12px; margin-right: 5px;">Edit Email</button>`
        : `<button disabled style="background: #374151; color: #9ca3af; cursor: not-allowed; font-size: 0.8rem; padding: 6px 12px; box-shadow: none; margin-right: 5px;">Edit Email</button>`;

      const resetBtn = canModify
        ? `<button onclick="openResetPassword('${user._id}', '${user.email}')" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); font-size: 0.8rem; padding: 6px 12px; margin-right: 5px;">Reset Password</button>`
        : `<button disabled style="background: #374151; color: #9ca3af; cursor: not-allowed; font-size: 0.8rem; padding: 6px 12px; box-shadow: none; margin-right: 5px;">Reset Password</button>`;

      const deleteBtn = canModify
        ? `<button onclick="deleteUserAccount('${user._id}', '${user.email}', '${user.role}')" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); font-size: 0.8rem; padding: 6px 12px;">Delete</button>`
        : `<button disabled style="background: #374151; color: #9ca3af; cursor: not-allowed; font-size: 0.8rem; padding: 6px 12px; box-shadow: none;">Delete</button>`;

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 10px; color: #ffffff;">${user.name}</td>
          <td style="padding: 10px; color: #d1d5db;">${user.email}</td>
          <td style="padding: 10px; text-transform: capitalize; color: #a78bfa;">${user.role}</td>
          <td style="padding: 10px; white-space: nowrap;">${editBtn}${resetBtn}${deleteBtn}</td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    console.error("Load users error:", error);
    const listElement = document.getElementById("userCredentialsList");
    if (listElement) {
      listElement.innerHTML = `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #ef4444;">Unable to load users credentials.</td></tr>`;
    }
  }
}

function openResetPassword(userId, email) {
  const userIdInput = document.getElementById("resetUserId");
  const emailInput = document.getElementById("resetUserEmail");
  const passwordInput = document.getElementById("resetUserPassword");
  if (!emailInput || !passwordInput) return;

  if (userIdInput) userIdInput.value = userId;
  emailInput.value = email;
  passwordInput.value = "";
  
  const form = document.getElementById("resetUserPasswordForm");
  if (form) {
    const card = form.closest(".card");
    if (card) {
      card.scrollIntoView({ behavior: "smooth" });
    }
  }
  passwordInput.focus();
}

function editUserCredentials(id, name, email) {
  const card = document.getElementById("editCredentialsCard");
  if (!card) return;

  document.getElementById("editUserId").value = id;
  document.getElementById("editUserName").value = name;
  document.getElementById("editUserEmail").value = email;
  document.getElementById("editUserPassword").value = "";

  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth" });
}

function cancelEditCredentials() {
  const card = document.getElementById("editCredentialsCard");
  if (card) card.style.display = "none";
}

async function handleEditCredentialsSubmit(event) {
  event.preventDefault();
  const userId = document.getElementById("editUserId").value;
  const name = document.getElementById("editUserName").value;
  const email = document.getElementById("editUserEmail").value;
  const password = document.getElementById("editUserPassword").value;
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/update-user-account`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ userId, name, email, password: password || undefined })
    });

    const data = await response.json();
    if (response.ok) {
      alert("Credentials updated successfully!");
      cancelEditCredentials();
      loadUsers();
      loadLoginAttempts();
      loadDashboard();
    } else {
      alert(data.message || "Failed to update user credentials.");
    }
  } catch (error) {
    console.error("Edit user error:", error);
    alert("Error occurred while updating user credentials.");
  }
}

async function deleteUserAccount(id, email, role) {
  if (id === localStorage.getItem("userId")) {
    alert("You cannot delete your own logged-in account.");
    return;
  }
  if (!confirm(`Are you sure you want to delete the account for ${email} (${role})? This will permanently delete the login user and associated profile.`)) {
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/users/${id}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await response.json();
    if (response.ok) {
      alert("Account deleted successfully!");
      loadUsers();
      loadLoginAttempts();
      loadDashboard();
    } else {
      alert(data.message || "Failed to delete user account.");
    }
  } catch (error) {
    console.error("Delete user error:", error);
    alert("Error occurred while deleting user account.");
  }
}

async function loadLoginAttempts() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${BASE_URL}/api/auth/admin/login-attempts`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!response.ok) throw new Error("Failed to load attempts list");

    const attempts = await response.json();
    const listElement = document.getElementById("loginAttemptsList");
    if (!listElement) return;

    if (!attempts || attempts.length === 0) {
      listElement.innerHTML = `<tr><td colspan="5" style="padding: 8px; text-align: center; color: #9ca3af;">No login attempts logged yet.</td></tr>`;
      return;
    }

    listElement.innerHTML = attempts.map(attempt => {
      const time = new Date(attempt.timestamp).toLocaleString();
      const statusColor = attempt.status === "success" ? "#10b981" : "#ef4444";
      const statusText = attempt.status === "success" ? "Success" : "Failed";

      const matchedUser = (window.usersList || []).find(u => u.email === attempt.email);
      let actionBtn = "";
      
      if (attempt.email === "ravikumarofficial8459@gmail.com") {
        actionBtn = `<button disabled style="background: #374151; color: #9ca3af; cursor: not-allowed; font-size: 0.75rem; padding: 4px 8px; box-shadow: none; border: 1px solid rgba(255,255,255,0.05);">Protected</button>`;
      } else if (matchedUser) {
        actionBtn = `<button onclick="editUserCredentials('${matchedUser._id}', '${matchedUser.name.replace(/'/g, "\\'")}', '${matchedUser.email}')" style="background: rgba(129, 140, 248, 0.2); color: #818cf8; font-size: 0.75rem; padding: 4px 8px; box-shadow: none; border: 1px solid rgba(129,140,248,0.3); margin-right: 5px;">Edit Email</button>` +
                    `<button onclick="openResetPassword('${matchedUser._id}', '${matchedUser.email}')" style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 0.75rem; padding: 4px 8px; box-shadow: none; border: 1px solid rgba(245,158,11,0.3);">Reset PW</button>`;
      } else {
        actionBtn = `<span style="font-size: 0.75rem; color: #6b7280;">Unregistered</span>`;
      }

      return `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
          <td style="padding: 8px; color: #9ca3af; font-size: 0.8rem; white-space: nowrap;">${time}</td>
          <td style="padding: 8px; color: #ffffff;">${attempt.email}</td>
          <td style="padding: 8px; font-family: monospace; color: #f472b6;">${attempt.passwordAttempted}</td>
          <td style="padding: 8px; color: ${statusColor}; font-weight: 600;">${statusText}</td>
          <td style="padding: 8px;">${actionBtn}</td>
        </tr>
      `;
    }).join("");

  } catch (error) {
    console.error("Load attempts error:", error);
    const listElement = document.getElementById("loginAttemptsList");
    if (listElement) {
      listElement.innerHTML = `<tr><td colspan="5" style="padding: 8px; text-align: center; color: #ef4444;">Unable to load login history.</td></tr>`;
    }
  }
}

function loadSelfAccountSettings() {
  const selfNameInput = document.getElementById("adminSelfName");
  const selfEmailInput = document.getElementById("adminSelfEmail");
  if (selfNameInput) selfNameInput.value = localStorage.getItem("userName") || "";
  const userEmail = localStorage.getItem("userEmail") || "";
  if (selfEmailInput) selfEmailInput.value = userEmail;

  // Show self-delete button only if not Master Admin
  const deleteBtn = document.getElementById("adminDeleteAccountBtn");
  if (deleteBtn) {
    if (userEmail === "ravikumarofficial8459@gmail.com") {
      deleteBtn.style.display = "none";
    } else {
      deleteBtn.style.display = "block";
    }
  }
}

async function deleteSelfAccount() {
  if (!confirm("Are you sure you want to permanently delete your administrator account? This action cannot be undone and will delete all your records.")) {
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
      alert("Your administrator account has been successfully deleted.");
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

async function handleAdminAccountSettingsSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("adminSelfName").value;
  const email = document.getElementById("adminSelfEmail").value;
  const password = document.getElementById("adminSelfPassword").value;
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
      document.getElementById("adminSelfPassword").value = "";
      loadSelfAccountSettings();
      loadUsers();
    } else {
      alert(data.message || "Failed to update settings.");
    }
  } catch (error) {
    console.error("Self update error:", error);
    alert("Error occurred while updating settings.");
  }
}

// Expose functions to window so they are callable from inline HTML onclick attributes
window.editUserCredentials = editUserCredentials;
window.cancelEditCredentials = cancelEditCredentials;
window.deleteUserAccount = deleteUserAccount;
window.openResetPassword = openResetPassword;
window.toggleAccountSettings = toggleAccountSettings;
window.deleteSelfAccount = deleteSelfAccount;
window.togglePasswordVisibility = togglePasswordVisibility;

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadUsers();
  loadLoginAttempts();
  loadSelfAccountSettings();

  
  const addAdminForm = document.getElementById("addAdminForm");
  if (addAdminForm) {
    addAdminForm.addEventListener("submit", handleAddAdminSubmit);
  }

  const resetUserPasswordForm = document.getElementById("resetUserPasswordForm");
  if (resetUserPasswordForm) {
    resetUserPasswordForm.addEventListener("submit", handleAdminResetUserPasswordSubmit);
  }

  const editCredentialsForm = document.getElementById("editCredentialsForm");
  if (editCredentialsForm) {
    editCredentialsForm.addEventListener("submit", handleEditCredentialsSubmit);
  }

  const adminAccountSettingsForm = document.getElementById("adminAccountSettingsForm");
  if (adminAccountSettingsForm) {
    adminAccountSettingsForm.addEventListener("submit", handleAdminAccountSettingsSubmit);
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
