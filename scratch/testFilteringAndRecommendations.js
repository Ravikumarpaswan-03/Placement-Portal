const assert = require("assert");

// Slide 9 matchJob logic simulation
function matchJob(studentSkills, requiredSkills) {
  const s = studentSkills.map(x => x.toLowerCase().trim()).filter(Boolean);
  const r = requiredSkills.map(x => x.toLowerCase().trim()).filter(Boolean);
  if (r.length === 0) return { score: 100, matched: [] };
  const matched = r.filter(skill => s.includes(skill));
  const score = Math.round((matched.length / r.length) * 100);
  return { score, matched };
}

// 1. Test Match Job Logic
console.log("Testing Slide 9 matchJob Logic...");

const testCases = [
  {
    student: ["react", "sql", "node"],
    job: ["react", "sql", "python"],
    expectedScore: 67,
    expectedMatched: ["react", "sql"]
  },
  {
    student: ["java", "spring"],
    job: [],
    expectedScore: 100,
    expectedMatched: []
  },
  {
    student: ["angular"],
    job: ["react", "node"],
    expectedScore: 0,
    expectedMatched: []
  },
  {
    student: ["react", "node", "css"],
    job: ["React", "CSS"],
    expectedScore: 100,
    expectedMatched: ["react", "css"]
  }
];

testCases.forEach((tc, idx) => {
  const result = matchJob(tc.student, tc.job);
  assert.strictEqual(result.score, tc.expectedScore, `Test Case ${idx + 1} score mismatch: got ${result.score}, expected ${tc.expectedScore}`);
  assert.deepStrictEqual(result.matched.sort(), tc.expectedMatched.sort(), `Test Case ${idx + 1} matched list mismatch`);
  console.log(`✓ Test Case ${idx + 1} passed: score=${result.score}, matched=[${result.matched}]`);
});

console.log("All matching logic tests passed successfully!");
