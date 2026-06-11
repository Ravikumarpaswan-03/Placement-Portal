const express = require("express");

const router = express.Router();
const validateIdMiddleware = require("../middlewares/validateIdMiddleware");
const authMiddleware = require("../middlewares/authMiddleware");

const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany
} = require("../controllers/companyController");

router.get("/", getCompanies);

router.get("/:id", validateIdMiddleware, getCompanyById);

router.post("/", authMiddleware, createCompany);

router.put("/:id", authMiddleware, validateIdMiddleware, updateCompany);

router.delete("/:id", authMiddleware, validateIdMiddleware, deleteCompany);

module.exports = router;