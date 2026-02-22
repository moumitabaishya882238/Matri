async function testBP() {
    console.log("--- Sending Initial Greeting ---");
    let res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Hi MATRI! How are you?" })
    });
    let data = await res.json();
    console.log("Full Response:\n", data);
}

testBP();
