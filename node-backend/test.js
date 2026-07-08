const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log("Starting integration tests on Node.js backend...");
  try {
    // 1. Test Root
    const rootRes = await axios.get(`${BASE_URL}/`);
    console.log("Root endpoint:", rootRes.data);

    // 2. Test Register
    const email = `test-${Date.now()}@example.com`;
    const password = 'password123';
    
    console.log(`Registering user: ${email}`);
    const regRes = await axios.post(`${BASE_URL}/auth/register`, { email, password });
    console.log("Register response:", regRes.data);

    // 3. Test Login (send as Form Data since the frontend does this)
    console.log("Logging in...");
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log("Login response:", loginRes.data);
    const token = loginRes.data.access_token;

    // 4. Test Classrooms List
    console.log("Listing classrooms...");
    const classRes = await axios.get(`${BASE_URL}/classrooms`);
    console.log(`Classrooms found: ${classRes.data.length}`);

    // 5. Test stats
    console.log("Getting stats...");
    const statsRes = await axios.get(`${BASE_URL}/timetable/stats`);
    console.log("Stats response:", statsRes.data);

    console.log("\nALL TESTS PASSED SUCCESSFULLY!");
  } catch (error) {
    console.error("Test failed:", error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

runTests();
