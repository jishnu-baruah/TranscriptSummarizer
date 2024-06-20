const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const dotenv = require('dotenv');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

dotenv.config();
const app = express();
const port = 3000;

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Initialize Google Generative AI
const API_KEY = process.env.API_KEY; // Ensure API_KEY is set in .env file
const MODEL_NAME = "gemini-1.0-pro";
const generationConfig = {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
};
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];
const genAI = new GoogleGenerativeAI(API_KEY, generationConfig, safetySettings);

// Endpoint to upload the transcript
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.originalname);
    const goScript = 'go'; // Assuming 'go' is in PATH environment variable
    const goFile = 'main.go'; // Path to your Go script
    // Execute the Go script
    exec(`${goScript} run ${goFile} -file "${filePath}"`, async (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Go script: ${error}`);
            return res.status(500).send('Error uploading file');
        }
        if (stderr) {
            console.error(`Go script stderr: ${stderr}`);
        }
        console.log(`Go script stdout: ${stdout}`);

        // Read the processed file content
        const fileContent = fs.readFileSync(filePath, 'utf-8').toString();

        // Summarize the content using Gemini model
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        try {
            const result = await model.generateContent(
                `Summarize this podcast transcript:${fileContent}`
            );
            const response = await result.response;
            const text = await response.text();
            console.log("Summary:", text);

            // Send the summarized text back to the client
            res.send(text);
        } catch (error) {
            console.error("Error generating content:", error);
            res.status(500).send('Error generating summary');
        }
    });
});

// Serve static files (e.g., your HTML file)
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});