const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    // Auto-seed primary administrator
    const User = require("../models/User");
    const bcrypt = require("bcryptjs");
    const adminEmail = "ravikumarofficial8459@gmail.com";
    
    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("ravi8459@placementportal", 10);
      await User.create({
        name: "Primary Admin",
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "admin",
        isVerified: true,
        canCreateAdmin: true
      });
      console.log(`Primary Administrator '${adminEmail}' seeded successfully.`);
    } else {
      let needsSave = false;
      if (adminExists.isVerified !== true) {
        adminExists.isVerified = true;
        needsSave = true;
        console.log(`Updated Primary Administrator '${adminEmail}' to verified status.`);
      }
      if (adminExists.canCreateAdmin !== true) {
        adminExists.canCreateAdmin = true;
        needsSave = true;
        console.log(`Updated Primary Administrator '${adminEmail}' with canCreateAdmin permission.`);
      }
      if (needsSave) {
        await adminExists.save();
      }
    }

  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;