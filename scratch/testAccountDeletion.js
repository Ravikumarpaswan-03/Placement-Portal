const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

const BACKEND_DIR = "c:/Users/RAVIKUMAR PASWAN/OneDrive/Desktop/Placement-Portal/backend";

// Load backend env
dotenv.config({ path: path.join(BACKEND_DIR, ".env") });

const User = require(path.join(BACKEND_DIR, "models/User"));
const Student = require(path.join(BACKEND_DIR, "models/Student"));
const Company = require(path.join(BACKEND_DIR, "models/Company"));
const Job = require(path.join(BACKEND_DIR, "models/Job"));
const Application = require(path.join(BACKEND_DIR, "models/Application"));
const connectDB = require(path.join(BACKEND_DIR, "config/db"));

const { deleteSelfAccount, adminDeleteUser } = require(path.join(BACKEND_DIR, "controllers/authController"));
const { deleteStudent } = require(path.join(BACKEND_DIR, "controllers/studentController"));
const { deleteCompany } = require(path.join(BACKEND_DIR, "controllers/companyController"));

// Mock Express req/res
function mockResponse() {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

async function runTest() {
  console.log("Connecting to MongoDB...");
  await connectDB();
  console.log("Connected to MongoDB!");

  try {
    // Clean up any old test users
    const testEmails = [
      "student_del_test@gmail.com",
      "company_del_test@gmail.com",
      "mentor_del_test@gmail.com",
      "admin_del_test@gmail.com",
      "admin_reque_test@gmail.com"
    ];
    await User.deleteMany({ email: { $in: testEmails } });
    await Student.deleteMany({ email: { $in: testEmails } });
    await Company.deleteMany({ contactEmail: { $in: testEmails } });
    await Job.deleteMany({ companyName: "Deletion Test Corp" });
    console.log("Cleaned up old test records.");

    // ============================================
    // Test 1: Student Self Deletion
    // ============================================
    console.log("\n--- Test 1: Student Self Deletion ---");
    const studentUser = await User.create({
      name: "Student Del Test",
      email: "student_del_test@gmail.com",
      passwordHash: "dummyhash",
      role: "student"
    });
    const studentProfile = await Student.create({
      userId: studentUser._id,
      name: "Student Del Test",
      email: "student_del_test@gmail.com",
      cgpa: 9.0
    });
    const dummyApp = await Application.create({
      studentId: studentProfile._id.toString(),
      jobId: "somejobid123",
      studentName: studentProfile.name,
      jobTitle: "Software Engineer",
      status: "Applied"
    });

    console.log("Seeded Student User, Profile, and Application.");
    
    // Call deleteSelfAccount
    const req1 = { user: { id: studentUser._id.toString() } };
    const res1 = mockResponse();
    await deleteSelfAccount(req1, res1);

    console.log("deleteSelfAccount Response:", res1.statusCode || 200, res1.body);

    // Verify cleanup
    const u1 = await User.findById(studentUser._id);
    const s1 = await Student.findById(studentProfile._id);
    const a1 = await Application.findById(dummyApp._id);

    console.log("Student User deleted:", !u1);
    console.log("Student Profile deleted:", !s1);
    console.log("Student Application deleted:", !a1);

    if (u1 || s1 || a1) {
      throw new Error("Student Self Deletion failed to clean up all records!");
    }
    console.log("Pass: Student self deletion completely purges all records.");

    // ============================================
    // Test 2: Company Self Deletion
    // ============================================
    console.log("\n--- Test 2: Company Self Deletion ---");
    const companyUser = await User.create({
      name: "Company Del Test",
      email: "company_del_test@gmail.com",
      passwordHash: "dummyhash",
      role: "company"
    });
    const companyProfile = await Company.create({
      userId: companyUser._id,
      name: "Deletion Test Corp",
      website: "http://testcorp.com",
      contactEmail: "company_del_test@gmail.com",
      gstin: "27AAAAA0000A1Z5"
    });
    const testJob = await Job.create({
      title: "Test Job Deletion",
      companyName: "Deletion Test Corp",
      companyId: companyProfile._id.toString()
    });
    const dummyApp2 = await Application.create({
      studentId: "somestudentid123",
      jobId: testJob._id.toString(),
      studentName: "Random Student",
      jobTitle: testJob.title,
      status: "Applied"
    });

    console.log("Seeded Company User, Profile, Job, and Application.");

    const req2 = { user: { id: companyUser._id.toString() } };
    const res2 = mockResponse();
    await deleteSelfAccount(req2, res2);

    console.log("deleteSelfAccount Response:", res2.statusCode || 200, res2.body);

    const u2 = await User.findById(companyUser._id);
    const c2 = await Company.findById(companyProfile._id);
    const j2 = await Job.findById(testJob._id);
    const a2 = await Application.findById(dummyApp2._id);

    console.log("Company User deleted:", !u2);
    console.log("Company Profile deleted:", !c2);
    console.log("Company Job deleted:", !j2);
    console.log("Job Application deleted:", !a2);

    if (u2 || c2 || j2 || a2) {
      throw new Error("Company Self Deletion failed to clean up all records!");
    }
    console.log("Pass: Company self deletion completely purges all records.");

    // ============================================
    // Test 3: Mentor Self Deletion
    // ============================================
    console.log("\n--- Test 3: Mentor Self Deletion ---");
    const mentorUser = await User.create({
      name: "Mentor Del Test",
      email: "mentor_del_test@gmail.com",
      passwordHash: "dummyhash",
      role: "mentor"
    });
    console.log("Seeded Mentor User.");

    const req3 = { user: { id: mentorUser._id.toString() } };
    const res3 = mockResponse();
    await deleteSelfAccount(req3, res3);

    console.log("deleteSelfAccount Response:", res3.statusCode || 200, res3.body);
    const u3 = await User.findById(mentorUser._id);
    console.log("Mentor User deleted:", !u3);
    if (u3) {
      throw new Error("Mentor Self Deletion failed!");
    }
    console.log("Pass: Mentor self deletion successfully deleted User.");

    // ============================================
    // Test 4: Master Admin Protection
    // ============================================
    console.log("\n--- Test 4: Master Admin Deletion Blocked ---");
    const masterAdmin = await User.findOne({ email: "ravikumarofficial8459@gmail.com" });
    if (!masterAdmin) {
      console.log("Skipping Master Admin protection check (Master Admin account not found in DB).");
    } else {
      const req4 = { user: { id: masterAdmin._id.toString() } };
      const res4 = mockResponse();
      await deleteSelfAccount(req4, res4);
      console.log("deleteSelfAccount Response Code (expected 403):", res4.statusCode);
      console.log("deleteSelfAccount Response Body:", res4.body);

      const u4 = await User.findById(masterAdmin._id);
      console.log("Master Admin User still exists:", !!u4);
      if (!u4 || res4.statusCode !== 403) {
        throw new Error("Security Breach: Master Admin account was deleted or not protected!");
      }
      console.log("Pass: Master Admin account deletion is blocked.");
    }

    // ============================================
    // Test 5: Admin Cascade Delete Student
    // ============================================
    console.log("\n--- Test 5: Admin Cascade Delete Student ---");
    const adminUser = await User.create({
      name: "Admin Reque Test",
      email: "admin_reque_test@gmail.com",
      passwordHash: "dummyhash",
      role: "admin"
    });
    const targetStudentUser = await User.create({
      name: "Student Del Test 2",
      email: "student_del_test_2@gmail.com",
      passwordHash: "dummyhash",
      role: "student"
    });
    const targetStudentProfile = await Student.create({
      userId: targetStudentUser._id,
      name: "Student Del Test 2",
      email: "student_del_test_2@gmail.com",
      cgpa: 8.5
    });
    const dummyApp5 = await Application.create({
      studentId: targetStudentProfile._id.toString(),
      jobId: "somejobid123",
      studentName: targetStudentProfile.name,
      jobTitle: "Backend Developer",
      status: "Applied"
    });

    console.log("Seeded Admin, Student User, Profile, and Application.");

    const req5 = {
      user: { id: adminUser._id.toString() },
      params: { id: targetStudentUser._id.toString() }
    };
    const res5 = mockResponse();
    await adminDeleteUser(req5, res5);

    console.log("adminDeleteUser Response:", res5.statusCode || 200, res5.body);

    const u5 = await User.findById(targetStudentUser._id);
    const s5 = await Student.findById(targetStudentProfile._id);
    const a5 = await Application.findById(dummyApp5._id);

    console.log("Student User deleted by Admin:", !u5);
    console.log("Student Profile deleted by Admin:", !s5);
    console.log("Student Application deleted by Admin:", !a5);

    if (u5 || s5 || a5) {
      throw new Error("Admin Delete User failed to cascade delete student records!");
    }
    console.log("Pass: Admin delete student cascades completely.");

    // Clean up adminUser
    await User.findByIdAndDelete(adminUser._id);

    console.log("\nALL TESTS PASSED SUCCESSFULLY!");

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Mongoose connection closed.");
  }
}

runTest();
