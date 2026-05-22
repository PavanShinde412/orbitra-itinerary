const fs = require('fs');
const pdfParse = require('pdf-parse');

// --- Main extraction function ---
const extractTextFromFile = async (file) => {
  const { path: filePath, buffer, mimetype } = file;

  // Helper to get buffer whether it's from disk or memory
  const getBuffer = () => {
    if (buffer) return buffer;
    if (filePath) return fs.readFileSync(filePath);
    throw new Error('No file buffer or path provided');
  };

  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(getBuffer());
      return { type: 'text', content: data.text };
    }

    if (mimetype.startsWith('image/')) {
      const base64 = getBuffer().toString('base64');
      return { type: 'image', content: base64, mimetype };
    }

    throw new Error('Unsupported file type');
  } catch (err) {
    throw new Error(`Extraction failed: ${err.message}`);
  }
};

module.exports = { extractTextFromFile };