const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/applications`;

function goBack() {
  const role = localStorage.getItem("userRole") || "student";
  if (role === "admin") {
    window.location.href = "admin-dashboard.html";
  } else if (role === "company") {
    window.location.href = "company-dashboard.html";
  } else if (role === "mentor") {
    window.location.href = "mentor-dashboard.html";
  } else {
    window.location.href = "student-dashboard.html";
  }
}

function renderApplicationList(applications) {
  const listElement = document.getElementById("applicationList");
  if (!listElement) return;

  if (!applications || applications.length === 0) {
    listElement.innerHTML = "<p>No applications found.</p>";
    return;
  }

  const role = localStorage.getItem("userRole") || "student";

  listElement.innerHTML = applications
    .map(app => {
      const isStaff = (role === "admin" || role === "company");
      const statusSelect = isStaff
        ? `
          <div style="display: flex; gap: 8px; margin-top: 10px; align-items: center; flex-wrap: wrap;">
            <select id="status-${app._id}" style="width: auto; margin-bottom: 0; padding: 6px 12px; font-size: 0.85rem;">
              <option value="Applied" ${app.status === "Applied" ? "selected" : ""}>Applied</option>
              <option value="Shortlisted" ${app.status === "Shortlisted" ? "selected" : ""}>Shortlisted</option>
              <option value="Selected" ${app.status === "Selected" ? "selected" : ""}>Selected</option>
              <option value="Rejected" ${app.status === "Rejected" ? "selected" : ""}>Rejected</option>
            </select>
            <button onclick="updateStatus('${app._id}')" style="padding: 6px 12px; font-size: 0.8rem; background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);">Update</button>
            ${role === "admin" ? `<button onclick="deleteApplication('${app._id}')" style="padding: 6px 12px; font-size: 0.8rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">Delete</button>` : ""}
          </div>
        `
        : `<p><strong>Status:</strong> <span class="badge ${getBadgeClass(app.status)}">${app.status}</span></p>`;

      return `
        <div class="card" style="margin-bottom: 15px; border-color: rgba(255, 255, 255, 0.05);">
          <h4>${app.jobTitle}</h4>
          <p><strong>Student:</strong> ${app.studentName}</p>
          <p><strong>Applied At:</strong> ${app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : "N/A"}</p>
          ${statusSelect}
        </div>
      `;
    })
    .join("");
}

function getBadgeClass(status) {
  switch (status) {
    case "Applied": return "badge-applied";
    case "Shortlisted": return "badge-shortlisted";
    case "Selected": return "badge-placed";
    case "Rejected": return "badge-rejected";
    default: return "badge-applied";
  }
}

async function getApplications() {
  try {
    const response = await fetch(API_URL, {
      headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    });
    if (!response.ok) throw new Error("Failed to load applications");
    renderApplicationList(await response.json());
  } catch (error) {
    console.error(error);
    const listElement = document.getElementById("applicationList");
    if (listElement) listElement.innerHTML = "<p>Unable to load applications.</p>";
  }
}

async function updateStatus(appId) {
  const status = document.getElementById(`status-${appId}`).value;
  try {
    const response = await fetch(`${API_URL}/${appId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({ status })
    });
    if (response.ok) {
      alert("Application status updated.");
      getApplications();
    } else {
      const data = await response.json();
      alert(data.message || "Failed to update status.");
    }
  } catch (error) {
    console.error(error);
    alert("Error updating status.");
  }
}

async function deleteApplication(appId) {
  if (!confirm("Are you sure you want to delete this application?")) return;
  try {
    const response = await fetch(`${API_URL}/${appId}`, {
      method: "DELETE",
      headers: { "Authorization": "Bearer " + localStorage.getItem("token") }
    });
    if (response.ok) {
      alert("Application deleted.");
      getApplications();
    } else {
      alert("Failed to delete application.");
    }
  } catch (error) {
    console.error(error);
    alert("Error deleting application.");
  }
}

async function createApplication(event) {
  event.preventDefault();
  const studentName = document.getElementById("applicationStudent").value;
  const jobTitle = document.getElementById("applicationJob").value;
  const status = document.getElementById("applicationStatus").value;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
      },
      body: JSON.stringify({ studentName, jobTitle, status })
    });
    if (response.ok) {
      alert("Application submitted successfully.");
      event.target.reset();
      getApplications();
    } else {
      const data = await response.json();
      alert(data.message || "Could not submit application.");
    }
  } catch (error) {
    console.error(error);
    alert("Unable to submit application.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole") || "student";
  if (role === "admin") {
    const createSec = document.getElementById("createApplicationSection");
    if (createSec) createSec.style.display = "block";
  }
  const form = document.getElementById("applicationForm");
  if (form) form.addEventListener("submit", createApplication);
  getApplications();
});