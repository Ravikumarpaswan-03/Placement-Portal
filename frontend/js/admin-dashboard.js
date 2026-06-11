const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/dashboard`;

function navigateTo(page) {
  window.location.href = page;
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
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

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  
  const addAdminForm = document.getElementById("addAdminForm");
  if (addAdminForm) {
    addAdminForm.addEventListener("submit", handleAddAdminSubmit);
  }
});
