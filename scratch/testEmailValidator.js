const { validateEmail } = require("../backend/utils/emailValidator");
const dns = require("dns").promises;

async function runTests() {
  // Let's first test a direct MX lookup to print the error object
  try {
    console.log("Direct resolveMx('gmail.com')...");
    const mx = await dns.resolveMx("gmail.com");
    console.log("Direct MX success:", mx);
  } catch (err) {
    console.log("Direct MX Error Code:", err.code);
    console.log("Direct MX Error Message:", err.message);
    console.log("Direct MX Full Error:", err);
  }

  const testCases = [
    { email: "test@gmail.com", expected: true, desc: "Real valid domain" },
    { email: "test@yopmail.com", expected: false, desc: "Disposable domain yopmail.com" },
    { email: "test@mailinator.com", expected: false, desc: "Disposable domain mailinator.com" },
    { email: "test@thisdomaindoesnotexist12345.xyz", expected: false, desc: "Non-existent domain" }
  ];

  console.log("\n=== Running Email Validator Tests ===");

  for (const tc of testCases) {
    console.log(`\nTesting: "${tc.email}" (${tc.desc})`);
    try {
      const res = await validateEmail(tc.email);
      console.log(`Result: valid=${res.valid}, message="${res.message}"`);
      if (res.valid === tc.expected) {
        console.log("✅ PASS");
      } else {
        console.log("❌ FAIL (Expected valid to be " + tc.expected + ")");
      }
    } catch (err) {
      console.log("❌ ERROR:", err.message);
    }
  }
}

runTests();
