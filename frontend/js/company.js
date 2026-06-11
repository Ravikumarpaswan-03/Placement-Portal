const BASE_URL = window.API_BASE_URL || "http://localhost:5000";
const API_URL = `${BASE_URL}/api/companies`;
let editingCompanyId = null;

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

function renderCompanyList(companies) {
  const listElement = document.getElementById("companyList");
  if (!listElement) return;

  if (!companies || companies.length === 0) {
    listElement.innerHTML = "<p>No companies found.</p>";
    return;
  }

  const role = localStorage.getItem("userRole") || "student";
  const canManage = (role === "admin" || role === "company");

  listElement.innerHTML = companies.map(company => {
    const manageBtns = canManage
      ? `
        <div style="display: flex; gap: 10px; margin-top: 15px;">
          <button class="btn" onclick="editCompany('${company._id}')" style="padding: 6px 12px; font-size: 0.8rem; background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%); box-shadow: none;">Edit</button>
          <button class="btn" onclick="deleteCompany('${company._id}')" style="padding: 6px 12px; font-size: 0.8rem; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); box-shadow: none;">Delete</button>
        </div>
      `
      : "";

    return `
      <div class="card" style="margin-bottom: 15px; border-color: rgba(255, 255, 255, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap;">
          <div>
            <h4>${company.name || company.companyName}</h4>
            <p><strong>Contact Email:</strong> ${company.contactEmail || company.email || "N/A"}</p>
            <p><strong>Sector:</strong> ${company.sector || "N/A"}</p>
            <p><strong>Website:</strong> ${company.website ? `<a href="${company.website}" target="_blank">${company.website}</a>` : "N/A"}</p>
            <p><strong>GSTIN:</strong> ${company.gstin || "N/A"}</p>
            <p><strong>Location:</strong> ${company.location || "N/A"}</p>
          </div>
          ${manageBtns}
        </div>
        <p>${company.description || "No description provided."}</p>
      </div>
    `;
  }).join("");
}

async function getCompanies() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to load companies");
    renderCompanyList(await response.json());
  } catch (error) {
    console.error(error);
    document.getElementById("companyList").innerHTML = "<p>Unable to load companies.</p>";
  }
}

async function editCompany(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error("Failed to fetch company details");
    
    const company = await response.json();
    
    document.getElementById("companyName").value = company.name || company.companyName || "";
    document.getElementById("companyEmail").value = company.contactEmail || company.email || "";
    document.getElementById("companySector").value = company.sector || "";
    document.getElementById("companyLocation").value = company.location || "";
    document.getElementById("companyWebsite").value = company.website || "";
    document.getElementById("companyGstin").value = company.gstin || "";
    document.getElementById("companyDescription").value = company.description || "";
    
    editingCompanyId = id;
    
    const formTitle = document.getElementById("formTitle");
    if (formTitle) formTitle.innerText = "Edit Company Details";
    
    const submitBtn = document.querySelector("#companyForm button[type='submit']");
    if (submitBtn) submitBtn.innerText = "Save Changes";
    
    // Scroll to the form
    document.getElementById("createCompanyCard").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error(error);
    alert("Could not load company details for editing.");
  }
}

async function deleteCompany(id) {
  if (!confirm("Are you sure you want to delete this company profile?")) {
    return;
  }
  
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });
    
    if (response.ok) {
      alert("Company deleted successfully.");
      getCompanies();
    } else {
      const data = await response.json();
      alert(data.message || "Could not delete company.");
    }
  } catch (error) {
    console.error(error);
    alert("Error occurred while deleting company.");
  }
}

async function saveCompany(event) {
  event.preventDefault();
  const name = document.getElementById("companyName").value;
  const contactEmail = document.getElementById("companyEmail").value;
  const sector = document.getElementById("companySector").value;
  const location = document.getElementById("companyLocation").value;
  const website = document.getElementById("companyWebsite").value;
  const gstin = document.getElementById("companyGstin").value;
  const description = document.getElementById("companyDescription").value;

  const payload = { name, contactEmail, sector, location, website, gstin, description };
  const token = localStorage.getItem("token");

  try {
    let response;
    if (editingCompanyId) {
      // Update existing
      response = await fetch(`${API_URL}/${editingCompanyId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });
    } else {
      // Create new
      response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify(payload)
      });
    }

    if (response.ok) {
      alert(editingCompanyId ? "Company updated successfully." : "Company created successfully.");
      event.target.reset();
      
      // Reset editing state
      editingCompanyId = null;
      const formTitle = document.getElementById("formTitle");
      if (formTitle) formTitle.innerText = "Create Company";
      
      const submitBtn = document.querySelector("#companyForm button[type='submit']");
      if (submitBtn) submitBtn.innerText = "Save";
      
      getCompanies();
    } else {
      const data = await response.json();
      alert(data.message || "Could not save company details.");
    }
  } catch (error) {
    console.error(error);
    alert("Unable to save company details.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("userRole") || "student";
  const createCompanyCard = document.getElementById("createCompanyCard");

  if (role === "student" || role === "mentor") {
    if (createCompanyCard) createCompanyCard.style.display = "none";
  }

  const companyForm = document.getElementById("companyForm");
  if (companyForm) companyForm.addEventListener("submit", saveCompany);
  getCompanies();
});