async function testChat() {
    try {
        const res = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Hi MATRI! My blood pressure is 120/80 today. I bled moderately. I slept for about 6 hours and have no fever."
            })
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

testChat();
