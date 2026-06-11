const mongoose = require("mongoose");

const validateIdMiddleware = (req, res, next) => {
  if (req.params.id && !mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }
  next();
};

module.exports = validateIdMiddleware;
