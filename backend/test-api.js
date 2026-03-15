async function run() {
  console.log("1️⃣ Testing Login...");
  
  let loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tripadh@test.com', password: '123456' })
  });
  
  let loginData = await loginRes.json();
  
  if (loginData.message === 'Invalid credentials' || !loginData.token) {
    console.log("User might not exist yet. Attempting to register...");
    await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test User', email: 'tripadh@test.com', password: '123456' })
    });
    
    // retry login
    loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tripadh@test.com', password: '123456' })
    });
    loginData = await loginRes.json();
  }
  
  console.log("Login Response:\n", JSON.stringify(loginData, null, 2));
  
  if (loginData.token) {
    console.log("\n2️⃣ Testing Prompt Improvement with Token...");
    const promptRes = await fetch('http://localhost:5000/api/prompts/improve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ prompt: 'write a story about space' })
    });
    
    const promptData = await promptRes.json();
    console.log("Prompt Response:\n", JSON.stringify(promptData, null, 2));
  } else {
    console.log("❌ Failed to get token, skipping prompt test.");
  }
}

run();
