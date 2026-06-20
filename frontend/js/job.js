const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/jobs`;
const APP_URL = `${BASE_URL}/api/applications`;

let studentProfile = null;
let studentApplications = [];
let currentEditJobId = null;
let allJobs = [];

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

function clearFilters() {
  const form = document.getElementById("searchForm");
  if (form) form.reset();
  getJobs();
}

function matchJob(studentSkills, requiredSkills) {
  const s = studentSkills.map(x => x.toLowerCase().trim()).filter(Boolean);
  const r = requiredSkills.map(x => x.toLowerCase().trim()).filter(Boolean);
  if (r.length === 0) return { score: 100, matched: [] };
  const matched = r.filter(skill => s.includes(skill));
  const score = Math.round((matched.length / r.length) * 100);
  return { score, matched };
}

function renderJobList(jobs) {
  const listElement = document.getElementById("jobList");
  if (!listElement) return;

  if (!jobs || jobs.length === 0) {
    listElement.innerHTML = "<p>No jobs found.</p>";
    return;
  }

  const role = localStorage.getItem("userRole") || "student";
  const studentCgpa = studentProfile ? (studentProfile.cgpa || 0) : 0;
  const studentSkills = studentProfile ? (studentProfile.skills || []) : [];
  const canManage = (role === "admin" || role === "company");

  listElement.innerHTML = jobs
    .map(job => {
      const skills = Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || "");
      const minCgpa = job.minCgpa || 0;

      let eligibilityBadge = "";
      let actionButtons = "";
      let matchBadge = "";
      let statusBadge = "";

      // Find application status
      const app = studentApplications.find(a => a.jobId === job._id);
      const appStatus = app ? app.status : "Not Applied";

      if (role === "student") {
        const isEligible = studentCgpa >= minCgpa;
        eligibilityBadge = isEligible
          ? `<span class="badge badge-placed" style="margin-left: 10px; font-size: 0.8rem; display: inline-block;">Eligible</span>`
          : `<span class="badge badge-rejected" style="margin-left: 10px; font-size: 0.8rem; display: inline-block;">Ineligible (Requires ${minCgpa} CGPA)</span>`;

        // Match Score calculation (Slide 9)
        const match = matchJob(studentSkills, job.skills || []);
        if (match.score > 0) {
          matchBadge = `<span class="badge" style="margin-left: 10px; font-size: 0.8rem; display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10b981;">${match.score}% Match (${match.matched.join(", ")})</span>`;
        } else {
          matchBadge = `<span class="badge" style="margin-left: 10px; font-size: 0.8rem; display: inline-block; background: rgba(255, 255, 255, 0.05); color: #9ca3af;">0% Match</span>`;
        }

        // Application status badge
        if (appStatus !== "Not Applied") {
          let badgeClass = "badge-applied";
          if (appStatus === "Shortlisted") badgeClass = "badge-shortlisted";
          else if (appStatus === "Selected" || appStatus === "Placed") badgeClass = "badge-placed";
          else if (appStatus === "Rejected") badgeClass = "badge-rejected";

          statusBadge = `<span class="badge ${badgeClass}" style="margin-left: 10px; font-size: 0.8rem; display: inline-block;">${appStatus}</span>`;
        }

        if (appStatus === "Not Applied") {
          actionButtons = isEligible
            ? `<button class="btn btn-apply" onclick="applyForJob('${job._id}', '${job.title.replace(/'/g, "\\'")}')" style="margin-top: 15px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">Apply Now</button>`
            : `<button class="btn btn-apply" disabled style="margin-top: 15px; background: #4b5563; box-shadow: none; cursor: not-allowed; opacity: 0.6;">Apply Now</button>`;
        } else {
          actionButtons = `<button class="btn btn-apply" disabled style="margin-top: 15px; background: rgba(255, 255, 255, 0.05); color: #9ca3af; box-shadow: none; cursor: not-allowed; border: 1px solid rgba(255,255,255,0.1);">Already Applied</button>`;
        }
      } else if (canManage) {
        actionButtons = `
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn" onclick="location.href='create-job.html?edit=${job._id}'" style="padding: 6px 12px; font-size: 0.8rem; background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%); box-shadow: none;">Edit Job</button>
            <button class="btn" onclick="deleteJob('${job._id}')" style="padding: 6px 12px; font-size: 0.8rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: none;">Delete Job</button>
          </div>
        `;
      }

      return `
        <div class="card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
            <div>
              <h4 style="display: flex; align-items: center; flex-wrap: wrap; gap: 8px;">
                ${job.title} 
                ${statusBadge}
                ${eligibilityBadge} 
                ${matchBadge}
              </h4>
              <p><strong>Company:</strong> ${job.companyName || "N/A"}</p>
              <p><strong>Location:</strong> ${job.location || "N/A"}</p>
              <p><strong>Salary/Package:</strong> ${job.salary || job.package || "N/A"}</p>
              <p><strong>Skills:</strong> ${skills || "N/A"}</p>
              <p style="color: #a78bfa;"><strong>Eligibility (Min CGPA):</strong> ${minCgpa || "None"}</p>
              <p><strong>Deadline:</strong> ${job.deadline ? new Date(job.deadline).toLocaleDateString() : "N/A"}</p>
            </div>
            ${actionButtons}
          </div>
          <p style="margin-top: 10px; white-space: pre-line;">${job.description || "No description provided."}</p>
        </div>
      `;
    })
    .join("");
}

async function fetchStudentApplications() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(APP_URL, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    if (response.ok) {
      studentApplications = await response.json();
    }
  } catch (error) {
    console.error("Failed to load student applications:", error);
  }
}

async function getJobs() {
  try {
    const role = localStorage.getItem("userRole") || "student";
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error("Failed to load jobs");
    }
    allJobs = await response.json();

    if (role === "student") {
      await Promise.all([
        fetchStudentProfile(),
        fetchStudentApplications()
      ]);
    }

    filterJobs();
  } catch (error) {
    console.error(error);
    const listElement = document.getElementById("jobList");
    if (listElement) {
      listElement.innerHTML = "<p>Unable to load jobs.</p>";
    }
  }
}

function filterJobs() {
  const universalQuery = document.getElementById("searchUniversal")?.value.toLowerCase() || "";
  const locationQuery = document.getElementById("searchLocation")?.value.toLowerCase() || "";
  const skillsQuery = document.getElementById("searchSkills")?.value.toLowerCase() || "";
  const minPackageQuery = parseFloat(document.getElementById("searchMinPackage")?.value) || 0;
  const deadlineQuery = document.getElementById("searchDeadline")?.value || "all";
  const sortBy = document.getElementById("sortJobsBy")?.value || "newest";

  const role = localStorage.getItem("userRole") || "student";
  const studentSkills = studentProfile ? (studentProfile.skills || []) : [];

  let filtered = allJobs.filter(job => {
    // Determine application status
    const app = studentApplications.find(a => a.jobId === job._id);
    const appStatus = app ? app.status : "Not Applied";

    // 1. Universal Search (Title, Company, Skills, Status)
    let universalMatch = true;
    if (universalQuery) {
      const titleLower = (job.title || "").toLowerCase();
      const companyLower = (job.companyName || "").toLowerCase();
      const statusLower = appStatus.toLowerCase();
      const skillsLower = Array.isArray(job.skills) 
        ? job.skills.map(s => s.toLowerCase()) 
        : (job.skills ? job.skills.toLowerCase().split(",").map(s => s.trim()) : []);

      const matchesTitle = titleLower.includes(universalQuery);
      const matchesCompany = companyLower.includes(universalQuery);
      const matchesStatus = statusLower.includes(universalQuery);
      const matchesSkills = skillsLower.some(s => s.includes(universalQuery));

      universalMatch = matchesTitle || matchesCompany || matchesStatus || matchesSkills;
    }

    // 2. Location filter
    const locationMatch = !locationQuery || (job.location && job.location.toLowerCase().includes(locationQuery));

    // 3. Required Skill filter
    let skillsMatch = true;
    if (skillsQuery) {
      const jobSkills = Array.isArray(job.skills)
        ? job.skills.map(s => s.toLowerCase())
        : (job.skills ? job.skills.toLowerCase().split(",").map(s => s.trim()) : []);
      
      skillsMatch = jobSkills.some(s => s.includes(skillsQuery));
    }

    // 4. Minimum Package filter
    let packageMatch = true;
    if (minPackageQuery > 0) {
      const jobPkgVal = parsePackage(job.salary || job.package);
      packageMatch = jobPkgVal >= minPackageQuery;
    }

    // 5. Deadline filter
    let deadlineMatch = true;
    if (deadlineQuery === "active" && job.deadline) {
      const deadlineDate = new Date(job.deadline);
      deadlineDate.setHours(23, 59, 59, 999);
      deadlineMatch = deadlineDate >= new Date();
    }

    return universalMatch && locationMatch && skillsMatch && packageMatch && deadlineMatch;
  });

  // Helper parser for packages
  function parsePackage(pkgStr) {
    if (!pkgStr) return 0;
    const cleanStr = pkgStr.toString().replace(/,/g, "");
    const matches = cleanStr.match(/(\d+(?:\.\d+)?)/);
    if (!matches) return 0;
    let val = parseFloat(matches[1]);
    if (val >= 10000) {
      val = val / 100000;
    }
    return val;
  }

  // Calculate Match Score Helper
  function getMatchScore(job) {
    if (role !== "student") return 0;
    const s = studentSkills.map(x => x.toLowerCase().trim()).filter(Boolean);
    const r = (job.skills || []).map(x => x.toLowerCase().trim()).filter(Boolean);
    if (r.length === 0) return 100;
    const matched = r.filter(skill => s.includes(skill));
    return Math.round((matched.length / r.length) * 100);
  }

  // 6. Sorting
  if (sortBy === "newest") {
    filtered.sort((a, b) => b._id.localeCompare(a._id));
  } else if (sortBy === "package") {
    filtered.sort((a, b) => parsePackage(b.salary || b.package) - parsePackage(a.salary || a.package));
  } else if (sortBy === "relevance") {
    filtered.sort((a, b) => getMatchScore(b) - getMatchScore(a));
  } else if (sortBy === "status") {
    const priority = { "Selected": 4, "Placed": 4, "Shortlisted": 3, "Interview": 3, "Applied": 2, "Not Applied": 1, "Rejected": 0 };
    filtered.sort((a, b) => {
      const appA = studentApplications.find(x => x.jobId === a._id);
      const appB = studentApplications.find(x => x.jobId === b._id);
      const statusA = appA ? appA.status : "Not Applied";
      const statusB = appB ? appB.status : "Not Applied";
      const valA = priority[statusA] !== undefined ? priority[statusA] : 0;
      const valB = priority[statusB] !== undefined ? priority[statusB] : 0;
      return valB - valA;
    });
  }

  renderJobList(filtered);
}

async function handleJobSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("jobTitle").value;
  const companyName = document.getElementById("jobCompany").value;
  const location = document.getElementById("jobLocation").value;
  const skills = document.getElementById("jobSkills").value
    .split(",")
    .map(skill => skill.trim())
    .filter(Boolean);
  const salary = document.getElementById("jobSalary").value;
  const deadline = document.getElementById("jobDeadline").value;
  const minCgpa = parseFloat(document.getElementById("jobMinCgpa")?.value) || 0;
  const description = document.getElementById("jobDescription").value;

  const payload = {
    title,
    companyName,
    location,
    salary,
    skills,
    deadline: deadline || undefined,
    minCgpa,
    description
  };

  try {
    let response;
    if (currentEditJobId) {
      // Update existing job
      response = await fetch(`${API_URL}/${currentEditJobId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Create new job
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
      alert(currentEditJobId ? "Job updated successfully." : "Job created successfully.");
      event.target.reset();
      window.location.href = "jobs.html";
    } else {
      alert(data.message || "Could not save job.");
    }
  } catch (error) {
    console.error(error);
    alert("Unable to save job details.");
  }
}

async function deleteJob(jobId) {
  if (!confirm("Are you sure you want to delete this job posting?")) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${jobId}`, {
      method: "DELETE"
    });

    if (response.ok) {
      alert("Job deleted successfully.");
      getJobs();
    } else {
      const data = await response.json();
      alert(data.message || "Could not delete job.");
    }
  } catch (error) {
    console.error(error);
    alert("Error occurred while deleting job.");
  }
}

async function applyForJob(jobId, jobTitle) {
  const studentName = localStorage.getItem("userName") || "Student";
  const token = localStorage.getItem("token");

  if (!token) {
    alert("You must be logged in to apply.");
    return;
  }

  try {
    const response = await fetch(APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        studentName,
        jobTitle,
        jobId,
        status: "Applied"
      })
    });

    const data = await response.json();
    if (response.ok) {
      alert(`Successfully applied for "${jobTitle}"!`);
    } else {
      alert(data.message || "Could not submit application.");
    }
  } catch (error) {
    console.error(error);
    alert("Unable to submit application.");
  }
}

async function fetchStudentProfile() {
  const token = localStorage.getItem("token");
  if (!token) return;

  try {
    const response = await fetch(`${BASE_URL}/api/students/profile`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    if (response.ok) {
      studentProfile = await response.json();
    }
  } catch (error) {
    console.error("Failed to load student profile for eligibility check:", error);
  }
}

async function checkEditState() {
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get("edit");
  
  if (editId) {
    try {
      const response = await fetch(`${API_URL}/${editId}`);
      if (!response.ok) throw new Error("Failed to fetch job data");
      
      const job = await response.json();
      
      // Fill the form fields
      document.getElementById("jobTitle").value = job.title || "";
      document.getElementById("jobCompany").value = job.companyName || "";
      document.getElementById("jobLocation").value = job.location || "";
      document.getElementById("jobSkills").value = Array.isArray(job.skills) ? job.skills.join(", ") : (job.skills || "");
      document.getElementById("jobSalary").value = job.salary || job.package || "";
      
      if (job.deadline) {
        document.getElementById("jobDeadline").value = new Date(job.deadline).toISOString().substring(0, 10);
      }
      
      document.getElementById("jobMinCgpa").value = job.minCgpa || "";
      document.getElementById("jobDescription").value = job.description || "";
      
      currentEditJobId = editId;
      
      const formTitle = document.getElementById("formTitle");
      if (formTitle) formTitle.innerText = "Edit Job Details";
      
      const submitBtn = document.getElementById("submitJobBtn");
      if (submitBtn) submitBtn.innerText = "Save Changes";
    } catch (error) {
      console.error(error);
      alert("Could not load job details for editing.");
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const role = localStorage.getItem("userRole") || "student";
  const postJobBtn = document.getElementById("postJobBtn");

  if (postJobBtn && role !== "student" && role !== "mentor") {
    postJobBtn.style.display = "block";
  }

  const jobForm = document.getElementById("jobForm");
  if (jobForm) {
    jobForm.addEventListener("submit", handleJobSubmit);
    await checkEditState();
  }

  if (document.getElementById("jobList")) {
    if (role === "student") {
      await fetchStudentProfile();
    }
    
    // Bind dynamic input smart search listeners
    const universalSearch = document.getElementById("searchUniversal");
    const locationSearch = document.getElementById("searchLocation");
    const skillsSearch = document.getElementById("searchSkills");
    const minPackageSearch = document.getElementById("searchMinPackage");
    const deadlineSearch = document.getElementById("searchDeadline");
    const sortJobsBy = document.getElementById("sortJobsBy");

    if (universalSearch) universalSearch.addEventListener("input", filterJobs);
    if (locationSearch) locationSearch.addEventListener("input", filterJobs);
    if (skillsSearch) skillsSearch.addEventListener("input", filterJobs);
    if (minPackageSearch) minPackageSearch.addEventListener("input", filterJobs);
    if (deadlineSearch) deadlineSearch.addEventListener("change", filterJobs);
    if (sortJobsBy) sortJobsBy.addEventListener("change", filterJobs);

    getJobs();
  }
});