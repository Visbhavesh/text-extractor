import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

function PDFTextExtractor() {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [extractedTexts, setExtractedTexts] = useState([]);
    const [wordCount, setWordCount] = useState(0);
    const [sentenceCount, setSentenceCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setSelectedFiles([...event.target.files]);
    };

    const handleUpload = async () => {
        setLoading(true);

        const formData = new FormData();
        for (const file of selectedFiles) {
            formData.append('dataFiles', file);
        }

        try {
            const response = await axios.post('http://localhost:3001/v2', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            const texts = response.data.extractedTexts;
            const extractedTextArray = Object.entries(texts).map(([fileName, text]) => ({ fileName, text }));
            setExtractedTexts(extractedTextArray);

            const totalText = extractedTextArray.map(({ text }) => text).join(' ');
            setWordCount(countWords(totalText));
            setSentenceCount(countSentences(totalText));
        } catch (error) {
            console.error('Error occurred during file upload:', error);
        } finally {
            setLoading(false);
        }
    };

    const countWords = (text) => {
        const words = text.split(/\s+/);
        return words.filter((word) => word !== '').length;
    };

    const countSentences = (text) => {
        const sentences = text.split(/[.!?]+/);
        return sentences.filter((sentence) => sentence !== '').length;
    };

    return (
        <div className="container">
            <h1>PDF Text Extractor</h1>
            <div className="upload-section">
                <input     className='button-two' type="file" onChange={handleFileChange} multiple />
                <button className='button-3' onClick={handleUpload} disabled={loading}>
                    {loading ? 'Extracting...' : 'Extract Text from PDF'}
                </button>
            </div>
            <div className="result-section">
                <h2>Extracted Texts:</h2>
                {extractedTexts.map((item, index) => (
                    <div key={index}>
                        <h3>{item.fileName}</h3>
                        <p>{item.text}</p>
                    </div>
                ))}

            </div>
            <div className="count-buttons">
                <button onClick={() => setWordCount(countWords(extractedTexts.join(' ')))}>Count Words</button>
                <button onClick={() => setSentenceCount(countSentences(extractedTexts.join(' ')))}>Count Sentences</button>
            </div>
            <div className="counts">
                <p>Word Count: {wordCount}</p>
                <p>Sentence Count: {sentenceCount}</p>
            </div>
        </div>
    );
}

export default PDFTextExtractor;
