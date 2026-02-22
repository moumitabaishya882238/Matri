async function testConversation() {
    console.log("--- Turn 1: BP only ---");
    let res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Hi MATRI! My blood pressure is 115/75 today." })
    });
    let data = await res.json();
    console.log("MATRI Reply 1:\n", data.reply);
    console.log("Extraction:\n", data.extractedData);

    console.log("\n--- Turn 2: Fever ---");
    res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Oh sorry, no fever." })
    });
    data = await res.json();
    console.log("MATRI Reply 2:\n", data.reply);
    console.log("Extraction:\n", data.extractedData);
    console.log("\nDatabase State:\n", data.currentLog);
}

testConversation();
