const express = require("express");
const fileUpload = require("express-fileupload");
const pdfParse = require("pdf-parse");
const mammoth = require('mammoth');
const cors = require('cors');
const anyText = require('any-text');
const fs = require('fs').promises;
const path = require('path');

const app = express();

app.use(cors());
app.use(fileUpload());

app.post("/", async (req, res) => {
    const extractedTexts = {};

    if (req.files && req.files.dataFiles) {
        const dataFiles = Array.isArray(req.files.dataFiles) ? req.files.dataFiles : [req.files.dataFiles];

        for (const file of dataFiles) {
            try {
                if (file.mimetype === 'application/pdf') {
                    const parsed = await pdfParse(file.data);
                    extractedTexts[file.name] = parsed.text;
                } else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                    const extractedText = await extractTextFromDocx(file.data);
                    extractedTexts[file.name] = extractedText;
                } else {
                    extractedTexts[file.name] = 'Unsupported file format';
                }
            } catch (error) {
                console.error("Error processing file:", error);
                extractedTexts[file.name] = null; // Push null for failed processing
            }
        }
    }

    res.json({ extractedTexts });
});
app.post('/v2', async (req, res) => {
    if (!req.files || !req.files.dataFiles) {
        return res.status(400).send('No files were uploaded.');
    }

    const dataFiles = Array.isArray(req.files.dataFiles) ? req.files.dataFiles : [req.files.dataFiles];
    const extractedTexts = {};

    for (const file of dataFiles) {
        try {
            const filePath = path.join(__dirname, 'uploads', file.name);
            await file.mv(filePath); // Save the file to a temporary location

            const text = await anyText.getText(filePath);
            extractedTexts[file.name] = text;


            await fs.unlink(filePath); // Remove the temporary file
        } catch (error) {
            console.error('Error extracting text:', error);
            extractedTexts[file.name] = null; // Push null for failed extraction
        }
    }

    res.json({ extractedTexts });
});


const extractTextFromDocx = async (docxData) => {
    return new Promise((resolve, reject) => {
        const buffer = Buffer.from(docxData);
        mammoth.extractRawText({ buffer })
            .then((result) => {
                resolve(result.value);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

app.listen(3001, () => {
    console.log("Server started at", 3001);
});
