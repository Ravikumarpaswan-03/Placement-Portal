const Job = require("../models/Job");

// Get All Jobs
exports.getJobs = async (req, res) => {
  try {
    const { search, company, location } = req.query;
    let query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }
    if (company) {
      query.companyName = { $regex: company, $options: "i" };
    }
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const jobs = await Job.find(query);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Job By ID
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create Job
exports.createJob = async (req, res) => {
  try {
    const { title, companyName, companyId, location, salary, package: jobPackage, skills, deadline, minCgpa, description } = req.body;
    const job = await Job.create({
      title,
      companyName,
      companyId,
      location,
      salary: salary || jobPackage,
      package: jobPackage || salary,
      skills,
      deadline,
      minCgpa,
      description
    });
    res.status(201).json({
      message: "Job created successfully",
      job
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Job
exports.updateJob = async (req, res) => {
  try {
    const { title, companyName, companyId, location, salary, package: jobPackage, skills, deadline, minCgpa, description } = req.body;
    const updateData = {
      title,
      companyName,
      companyId,
      location,
      salary: salary || jobPackage,
      package: jobPackage || salary,
      skills,
      deadline,
      minCgpa,
      description
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const job = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({
      message: "Job updated successfully",
      job
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Job
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};