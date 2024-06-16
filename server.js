const express = require('express');
const multer = require('multer');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config();

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
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Endpoint to upload the transcript
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.file.originalname);
    const goScript = 'go'; // Path to the Go executable
    const goFile = 'main.go'; // Path to your Go script
    console.log("hi this kjgkjvkjgkjggkjkjg", filePath)
    // Execute the Go script
    exec(`${goScript} run ${goFile} -file "${filePath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Go script: ${error}`);
            return res.status(500).send('Error uploading file');
        }
        if (stderr) {
            console.error(`Go script stderr: ${stderr}`);
        }
        console.log(`Go script stdout: ${stdout}`);
        res.send('File uploaded and processed successfully');
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
