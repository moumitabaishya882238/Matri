const { spawn } = require('child_process');
const path = require('path');

const processChatMessage = (userMessage, currentStateStr = '{}') => {
    return new Promise((resolve, reject) => {
        // Path to the python script
        const scriptPath = path.join(__dirname, '..', 'gemini_extractor.py');

        // Spawn python process
        // Use 'python' or 'python3' based on environment. 'python' is typical on Windows.
        const pythonProcess = spawn('python', [scriptPath, userMessage, currentStateStr]);

        let outputData = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (data) => {
            outputData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error("Python script exited with code", code);
                console.error("Error output:", errorData);
                // Sometimes Python writes the JSON error to stdout even with code 1, check outputData
                try {
                    const errJson = JSON.parse(outputData);
                    return reject(new Error(errJson.error || 'Python script failed'));
                } catch (e) {
                    return reject(new Error(`Python script failed: ${errorData}`));
                }
            }

            try {
                const jsonData = JSON.parse(outputData.trim());
                if (jsonData.error) {
                    return reject(new Error(jsonData.error));
                }
                resolve(jsonData);
            } catch (parseError) {
                console.error("Failed to parse python output:", outputData);
                reject(new Error("Python script returned invalid JSON"));
            }
        });
    });
};

module.exports = {
    processChatMessage
};
