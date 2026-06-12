const Company = require("../models/Company");

// Get All Companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().populate("userId", "email name role");
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Company By ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        message: "Company not found"
      });
    }

    res.json(company);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Company
exports.createCompany = async (req, res) => {
  try {
    const { name, companyName, website, sector, contactEmail, email, location, description, gstin } = req.body;

    // Validation checks
    if (!website) {
      return res.status(400).json({ message: "Website URL is required" });
    }
    const websiteRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\/.*)?$/;
    if (!websiteRegex.test(website)) {
      return res.status(400).json({ message: "Invalid website URL format" });
    }

    if (!gstin) {
      return res.status(400).json({ message: "GSTIN number is required" });
    }
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    if (!gstinRegex.test(gstin)) {
      return res.status(400).json({ message: "Invalid GSTIN number format. Should be a 15-character Indian GSTIN (e.g., 27AAAAA0000A1Z5)." });
    }

    const company = await Company.create({
      name: name || companyName,
      website,
      sector,
      contactEmail: contactEmail || email,
      location,
      description,
      gstin: gstin.toUpperCase(),
      userId: req.user.id // Save creator's user reference
    });

    res.status(201).json({
      message: "Company created successfully",
      company
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Company
exports.updateCompany = async (req, res) => {
  try {
    const { name, companyName, website, sector, contactEmail, email, location, description, gstin } = req.body;
    
    // 1. Fetch company to verify ownership
    const companyToUpdate = await Company.findById(req.params.id);
    if (!companyToUpdate) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    // 2. Authorization Check: Must be admin or the profile owner
    if (req.user.role !== "admin" && (!companyToUpdate.userId || companyToUpdate.userId.toString() !== req.user.id)) {
      return res.status(403).json({ message: "Access denied. You can only modify your own company profile." });
    }

    // Validation checks if website is provided
    if (website !== undefined) {
      if (!website) {
        return res.status(400).json({ message: "Website URL cannot be empty" });
      }
      const websiteRegex = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+(\/.*)?$/;
      if (!websiteRegex.test(website)) {
        return res.status(400).json({ message: "Invalid website URL format" });
      }
    }

    // Validation checks if GSTIN is provided
    if (gstin !== undefined) {
      if (!gstin) {
        return res.status(400).json({ message: "GSTIN number cannot be empty" });
      }
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/i;
      if (!gstinRegex.test(gstin)) {
        return res.status(400).json({ message: "Invalid GSTIN number format. Should be a 15-character Indian GSTIN (e.g., 27AAAAA0000A1Z5)." });
      }
    }

    const updateData = {
      name: name || companyName,
      website,
      sector,
      contactEmail: contactEmail || email,
      location,
      description,
      gstin: gstin ? gstin.toUpperCase() : undefined
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: "Company updated successfully",
      company
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Company
exports.deleteCompany = async (req, res) => {
  try {
    // 1. Fetch company to verify ownership
    const companyToDelete = await Company.findById(req.params.id);
    if (!companyToDelete) {
      return res.status(404).json({ message: "Company profile not found" });
    }

    // 2. Authorization Check: Must be admin or the profile owner
    if (req.user.role !== "admin" && (!companyToDelete.userId || companyToDelete.userId.toString() !== req.user.id)) {
      return res.status(403).json({ message: "Access denied. You can only delete your own company profile." });
    }

    await Company.findByIdAndDelete(req.params.id);

    res.json({
      message: "Company deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};