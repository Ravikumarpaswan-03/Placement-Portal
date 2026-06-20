const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/students`;
let currentStudentProfileId = null;
let allStudents = [];

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
    listElement.innerHTML = "<p style='color: #9ca3af; text-align: center; padding: 20px 0;'>No students matched your search criteria.</p>";
    return;
  }

  const role = localStorage.getItem("userRole") || "student";

  listElement.innerHTML = students
    .map(student => {
      const deleteBtn = role === "admin"
        ? `<button onclick="deleteStudent('${student._id}')" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2); font-size: 0.85rem; padding: 6px 12px; margin-top: 10px;">Delete</button>`
        : "";

      return `
        <div class="card" style="margin-bottom: 15px; border-color: rgba(255, 255, 255, 0.05);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div>
              <h4>${student.name}</h4>
              <p><strong>Profile Email:</strong> ${student.email}</p>
              ${student.userId ? `<p><strong>Login Account Email:</strong> <span style="color: #818cf8; font-weight: bold;">${student.userId.email}</span></p>` : ""}
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

// Fetch all students (Admin/Mentor only)
async function getStudents() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Failed to load students");
    }
    allStudents = await response.json();
    filterStudents();
  } catch (error) {
    console.error(error);
    const listElement = document.getElementById("studentList");
    if (listElement) {
      listElement.innerHTML = "<p>Unable to load students.</p>";
    }
  }
}

// Filter students dynamically based on search inputs
function filterStudents() {
  const nameQuery = document.getElementById("searchStudentName")?.value.toLowerCase() || "";
  const skillsQuery = document.getElementById("searchStudentSkills")?.value.toLowerCase() || "";
  const cgpaQuery = parseFloat(document.getElementById("searchStudentCgpa")?.value) || 0;

  const filtered = allStudents.filter(student => {
    const nameMatch = !nameQuery || 
      (student.name && student.name.toLowerCase().includes(nameQuery)) || 
      (student.email && student.email.toLowerCase().includes(nameQuery));
      
    const skillsMatch = !skillsQuery || 
      (student.skills && student.skills.some(skill => skill.toLowerCase().includes(skillsQuery)));
      
    const cgpaMatch = !cgpaQuery || 
      (student.cgpa && student.cgpa >= cgpaQuery);

    return nameMatch && skillsMatch && cgpaMatch;
  });

  renderStudentList(filtered);
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

// Upload PDF Resume
async function handleResumeUpload() {
  const fileInput = document.getElementById("studentResumeFile");
  const uploadStatus = document.getElementById("uploadStatus");
  const token = localStorage.getItem("token");

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    alert("Please select a PDF file to upload.");
    return;
  }

  const file = fileInput.files[0];
  if (file.type !== "application/pdf") {
    alert("Only PDF files are allowed.");
    return;
  }

  const formData = new FormData();
  formData.append("resume", file);

  try {
    if (uploadStatus) {
      uploadStatus.style.display = "block";
      uploadStatus.style.color = "#a78bfa";
      uploadStatus.innerText = "Uploading resume...";
    }

    const response = await fetch(`${API_URL}/profile/resume`, {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token
      },
      body: formData
    });

    const data = await response.json();
    if (response.ok) {
      if (uploadStatus) {
        uploadStatus.style.color = "#10b981";
        uploadStatus.innerText = "Resume uploaded successfully!";
      }
      // Prefill resume URL input box
      const resumeInput = document.getElementById("studentResume");
      if (resumeInput) {
        resumeInput.value = data.resumeLink || data.resumeUrl;
      }
    } else {
      if (uploadStatus) {
        uploadStatus.style.color = "#ef4444";
        uploadStatus.innerText = data.message || "Failed to upload resume.";
      }
    }
  } catch (error) {
    console.error("Upload error:", error);
    if (uploadStatus) {
      uploadStatus.style.color = "#ef4444";
      uploadStatus.innerText = "Error uploading resume. Check backend connection.";
    }
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

  // Bind student filters
  const nameSearch = document.getElementById("searchStudentName");
  const skillsSearch = document.getElementById("searchStudentSkills");
  const cgpaSearch = document.getElementById("searchStudentCgpa");

  if (nameSearch) nameSearch.addEventListener("input", filterStudents);
  if (skillsSearch) skillsSearch.addEventListener("input", filterStudents);
  if (cgpaSearch) cgpaSearch.addEventListener("input", filterStudents);

  // Bind PDF file input text change
  const fileInput = document.getElementById("studentResumeFile");
  const uploadLabel = document.getElementById("fileUploadLabel");
  if (fileInput && uploadLabel) {
    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        uploadLabel.innerText = "📄 " + fileInput.files[0].name;
      } else {
        uploadLabel.innerText = "📁 Choose PDF File...";
      }
    });
  }

  // Bind upload file button
  const uploadBtn = document.getElementById("uploadResumeBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", handleResumeUpload);
  }

  const studentForm = document.getElementById("studentForm");
  if (studentForm) {
    studentForm.addEventListener("submit", handleFormSubmit);
  }
});