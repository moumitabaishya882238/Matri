async function testReset() {
    console.log("--- Resetting Log ---");
    let res = await fetch('http://localhost:5000/chat/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    let data = await res.json();
    console.log("Reset Response:\n", data);

    console.log("\n--- Sending New Message After Reset ---");
    res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Hi MATRI! New start. My blood pressure is 112/72." })
    });
    data = await res.json();
    console.log("MATRI Reply:\n", data.reply);
    console.log("Database State:\n", data.currentLog);
}

testReset();
