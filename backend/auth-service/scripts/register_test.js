(async () => {
  try {
    const timestamp = Date.now();
    const email = process.env.TEST_EMAIL || `testuser+${timestamp}@example.com`;
    const res = await fetch('http://localhost:8001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email,
        password: 'Aa1!password',
        college: 'Test College',
        role: 'participant'
      })
    });
    const data = await res.json();
    console.log('Attempting register with email:', email);
    console.log('Status:', res.status);
    console.log('Data:', data);
  } catch (err) {
    console.error('Request error:', err.message);
    process.exit(1);
  }
})();