const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/students`;
let currentStudentProfileId = null;

function goBack() {
  const role = localStorage.getItem("userRole") || "student";
  if (role === "admin") {
    window.location.href = "admin-dashboard.html";
  } else if (role === "mentor") {
    window.location.href = "mentor-dashboard.html";
  } else {
    window.location.href = "student-dashboard.html";
  }
}

// Render the list of students
function renderStudentList(students) {
  const listElement = document.getElementById("studentList");
  if (!listElement) return;

  if (!students || students.length === 0) {
    listElement.innerHTML = "<p>No students found.</p>";
    return;
  }

  const role = localStorage.getItem("userRole") || "student";

  listElement.innerHTML = students
    .map(student => {
      const deleteBtn = role === "admin"
        ? `<button onclick="deleteStudent('${student._id}')" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2); font-size: 0.85rem; padding: 6px 12px;">Delete</button>`
        : "";

      return `
        <div class="card" style="margin-bottom: 15px; border-color: rgba(255, 255, 255, 0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <div>
              <h4>${student.name}</h4>
              <p><strong>Email:</strong> ${student.email}</p>
              <p><strong>Skills:</strong> ${(student.skills || []).join(", ") || "N/A"}</p>
              <p><strong>CGPA:</strong> ${student.cgpa || "N/A"}</p>
              <p><strong>Resume:</strong> ${student.resumeLink ? `<a href="${student.resumeLink}" target="_blank">View Resume</a>` : "N/A"}</p>
            </div>
            ${deleteBtn}
          </div>
        </div>
      `;
    })
    .join("");
}

// Fetch all students (Admin only)
async function getStudents() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Failed to load students");
    }
    const students = await response.json();
    renderStudentList(students);
  } catch (error) {
    console.error(error);
    const listElement = document.getElementById("studentList");
    if (listElement) {
      listElement.innerHTML = "<p>Unable to load students.</p>";
    }
  }
}

// Fetch personal profile (Student only)
async function getProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    if (!response.ok) {
      throw new Error("Failed to load profile");
    }

    const student = await response.json();
    currentStudentProfileId = student._id;
    document.getElementById("studentName").value = student.name || "";
    document.getElementById("studentEmail").value = student.email || "";
    document.getElementById("studentSkills").value = (student.skills || []).join(", ") || "";
    document.getElementById("studentCgpa").value = student.cgpa || "";
    document.getElementById("studentResume").value = student.resumeLink || "";
  } catch (error) {
    console.error("Profile load error:", error);
    alert("Could not load profile details.");
  }
}

// Handle save/create action
async function handleFormSubmit(event) {
  event.preventDefault();

  const role = localStorage.getItem("userRole") || "student";
  const name = document.getElementById("studentName").value;
  const email = document.getElementById("studentEmail").value;
  const skills = document.getElementById("studentSkills").value
    .split(",")
    .map(skill => skill.trim())
    .filter(Boolean);
  const cgpa = parseFloat(document.getElementById("studentCgpa").value) || undefined;
  const resumeLink = document.getElementById("studentResume").value;

  const payload = { name, email, skills, cgpa, resumeLink };

  try {
    let response;
    if (role === "student") {
      // Update personal profile
      const token = localStorage.getItem("token");
      response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Create student as Admin
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    }

    const data = await response.json();
    if (response.ok) {
      alert(role === "student" ? "Profile updated successfully." : "Student created successfully.");
      if (role === "admin") {
        event.target.reset();
        getStudents();
      }
    } else {
      alert(data.message || "Failed to save details.");
    }
  } catch (error) {
    console.error(error);
    alert("Error occurred while saving profile.");
  }
}

// Delete student (Admin only)
async function deleteStudent(studentId) {
  if (!confirm("Are you sure you want to delete this student and their account?")) {
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_URL}/${studentId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();
    if (response.ok) {
      alert("Student deleted successfully.");
      getStudents();
    } else {
      alert(data.message || "Could not delete student.");
    }
  } catch (error) {
    console.error("Delete error:", error);
    alert("Error deleting student.");
  }
}

// Delete student's own account (Student self-service)
async function deleteSelfAccount() {
  if (!currentStudentProfileId) {
    alert("Profile details not loaded yet.");
    return;
  }
  if (!confirm("Are you sure you want to permanently delete your student profile and user account? This action cannot be undone.")) {
    return;
  }
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/${currentStudentProfileId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    if (response.ok) {
      alert("Your account has been successfully deleted.");
      localStorage.clear();
      window.location.href = "../index.html";
    } else {
      const data = await response.json();
      alert(data.message || "Could not delete your account.");
    }
  } catch (error) {
    console.error(error);
    alert("An error occurred while deleting your account.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole") || "student";
  const pageHeader = document.getElementById("pageHeader");
  const formTitle = document.getElementById("formTitle");
  const studentListSection = document.getElementById("studentListSection");
  const profileFormSection = document.getElementById("profileFormSection");
  const deleteAccountBtn = document.getElementById("deleteAccountBtn");

  if (role === "student") {
    if (pageHeader) pageHeader.innerText = "My Profile";
    if (formTitle) formTitle.innerText = "Update My Details";
    if (deleteAccountBtn) deleteAccountBtn.style.display = "block";
    getProfile();
  } else if (role === "admin") {
    if (pageHeader) pageHeader.innerText = "Student Management";
    if (formTitle) formTitle.innerText = "Add New Student";
    if (studentListSection) studentListSection.style.display = "block";
    getStudents();
  } else if (role === "mentor") {
    if (pageHeader) pageHeader.innerText = "Student Directory";
    if (profileFormSection) profileFormSection.style.display = "none";
    if (studentListSection) studentListSection.style.display = "block";
    getStudents();
  }

  const studentForm = document.getElementById("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", handleFormSubmit);
  }
});