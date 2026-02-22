async function testChat() {
    try {
        const res = await fetch('http://localhost:5000/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Hi Matte! I'm so exhausted today, my baby just won't stop crying. Also my blood pressure is 110/70."
            })
        });
        const data = await res.json();
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

testChat();
