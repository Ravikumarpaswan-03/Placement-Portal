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
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    const userNameElement = document.getElementById("userName");
    const userEmailElement = document.getElementById("userEmail");

    if (userNameElement) userNameElement.innerText = "Welcome, " + (userName || "Student") + "!";
    if (userEmailElement) userEmailElement.innerText = userEmail || "N/A";

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "../index.html";
      return;
    }

    // Fetch Application Stats and Draw Chart
    const analyticsResponse = await fetch(`${BASE_URL}/api/analytics/dashboard-data`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    let applied = 0, shortlisted = 0, selected = 0, rejected = 0;

    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      const dist = analyticsData.applicationDistribution || {};
      
      applied = dist.Applied || 0;
      shortlisted = dist.Shortlisted || 0;
      selected = dist.Selected || 0;
      rejected = dist.Rejected || 0;

      const appliedCount = document.getElementById("appliedCount");
      const shortlistedCount = document.getElementById("shortlistedCount");
      const selectedCount = document.getElementById("selectedCount");

      if (appliedCount) appliedCount.innerText = applied;
      if (shortlistedCount) shortlistedCount.innerText = shortlisted;
      if (selectedCount) selectedCount.innerText = selected;

      // Draw Chart.js doughnut
      const ctx = document.getElementById("analyticsChart");
      if (ctx) {
        new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: ["Applied", "Shortlisted", "Selected", "Rejected"],
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
                labels: {
                  color: "#f3f4f6",
                  font: {
                    family: "'Outfit', sans-serif"
                  }
                }
              }
            }
          }
        });
      }
    }

    // Fetch Student Profile, Jobs, and Applications to compute recommendations
    const [profileRes, jobsRes, appsRes] = await Promise.all([
      fetch(`${BASE_URL}/api/students/profile`, { headers: { "Authorization": "Bearer " + token } }),
      fetch(`${BASE_URL}/api/jobs`, { headers: { "Authorization": "Bearer " + token } }),
      fetch(`${BASE_URL}/api/applications`, { headers: { "Authorization": "Bearer " + token } })
    ]);

    if (profileRes.ok && jobsRes.ok && appsRes.ok) {
      const student = await profileRes.json();
      const jobs = await jobsRes.json();
      const applications = await appsRes.json();

      const studentSkills = student.skills || [];
      const studentCgpa = student.cgpa || 0;

      // Slide 9 matchJob logic
      function matchJob(studentSkills, requiredSkills) {
        const s = studentSkills.map(x => x.toLowerCase().trim()).filter(Boolean);
        const r = requiredSkills.map(x => x.toLowerCase().trim()).filter(Boolean);
        if (r.length === 0) return { score: 100, matched: [] };
        const matched = r.filter(skill => s.includes(skill));
        const score = Math.round((matched.length / r.length) * 100);
        return { score, matched };
      }

      // Compute score and details for each job
      const recommendations = jobs.map(job => {
        const match = matchJob(studentSkills, job.skills || []);
        const app = applications.find(a => a.jobId === job._id);
        return {
          job,
          score: match.score,
          matched: match.matched,
          status: app ? app.status : "Not Applied"
        };
      });

      // Filter: score > 0 and student has not been rejected from it
      const filteredRecommendations = recommendations.filter(rec => rec.score > 0 && rec.status !== "Rejected");

      // Sort by score descending
      filteredRecommendations.sort((a, b) => b.score - a.score);

      const recCard = document.getElementById("jobRecommendationsCard");
      const recList = document.getElementById("recommendationsList");

      if (recCard) recCard.style.display = "block";

      if (recList) {
        if (filteredRecommendations.length === 0) {
          recList.innerHTML = `<p style="font-size: 0.9rem; color: #9ca3af; text-align: center;">No job recommendations found matching your skills. Try adding more skills to your profile!</p>`;
        } else {
          // Display top 3 matching jobs
          recList.innerHTML = filteredRecommendations.slice(0, 3).map(rec => {
            const job = rec.job;
            const isEligible = studentCgpa >= (job.minCgpa || 0);
            const eligibilityBadge = isEligible
              ? `<span class="badge badge-placed" style="font-size: 0.75rem;">Eligible</span>`
              : `<span class="badge badge-rejected" style="font-size: 0.75rem;">Ineligible (Req ${job.minCgpa} CGPA)</span>`;

            return `
              <div class="recommendation-item" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding: 12px 0; display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap;">
                <div>
                  <h4 style="margin: 0 0 5px 0; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                    ${job.title} ${eligibilityBadge}
                    <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 0.75rem;">${rec.score}% Match</span>
                  </h4>
                  <p style="margin: 0 0 4px 0; font-size: 0.8rem; color: #9ca3af;"><strong>Company:</strong> ${job.companyName || "N/A"} | <strong>Location:</strong> ${job.location || "N/A"}</p>
                  <p style="margin: 0; font-size: 0.75rem; color: #a78bfa;"><strong>Matched Skills:</strong> ${rec.matched.join(", ") || "None"}</p>
                </div>
                <div>
                  <button class="btn" onclick="navigateTo('jobs.html')" style="padding: 6px 12px; font-size: 0.8rem;">View & Apply</button>
                </div>
              </div>
            `;
          }).join("");
        }
      }
    }
  } catch (error) {
    console.error("Error loading student dashboard:", error);
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
  const selfNameInput = document.getElementById("studentSelfName");
  const selfEmailInput = document.getElementById("studentSelfEmail");
  if (selfNameInput) selfNameInput.value = localStorage.getItem("userName") || "";
  if (selfEmailInput) selfEmailInput.value = localStorage.getItem("userEmail") || "";
}

async function handleStudentAccountSettingsSubmit(event) {
  event.preventDefault();
  const name = document.getElementById("studentSelfName").value;
  const email = document.getElementById("studentSelfEmail").value;
  const password = document.getElementById("studentSelfPassword").value;
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
      document.getElementById("studentSelfPassword").value = "";
      loadSelfAccountSettings();
      
      const userNameElement = document.getElementById("userName");
      const userEmailElement = document.getElementById("userEmail");
      if (userNameElement) userNameElement.innerText = "Welcome, " + name + "!";
      if (userEmailElement) userEmailElement.innerText = email;
    } else {
      alert(data.message || "Failed to update settings.");
    }
  } catch (error) {
    console.error("Self update error:", error);
    alert("Error occurred while updating settings.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadStudentDashboard();

  loadSelfAccountSettings();

  const studentAccountSettingsForm = document.getElementById("studentAccountSettingsForm");
  if (studentAccountSettingsForm) {
    studentAccountSettingsForm.addEventListener("submit", handleStudentAccountSettingsSubmit);
  }
});
