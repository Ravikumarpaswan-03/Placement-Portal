const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    // Drop unique indexes on email to enable multi-account support
    try {
      await mongoose.connection.collection("users").dropIndex("email_1");
      console.log("Dropped unique index email_1 from users collection.");
    } catch (e) {
      // Index did not exist or was already dropped
    }
    try {
      await mongoose.connection.collection("students").dropIndex("email_1");
      console.log("Dropped unique index email_1 from students collection.");
    } catch (e) {
      // Index did not exist or was already dropped
    }

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