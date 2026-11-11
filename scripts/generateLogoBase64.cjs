const fs = require('fs');
const path = require('path');

const logoPath = path.resolve(__dirname, '../public/wooly-bloom-logo.png');
const targetPath = path.resolve(__dirname, '../src/assets/logoBase64.js');

const imageBuffer = fs.readFileSync(logoPath);
const base64Data = `data:image/png;base64,${imageBuffer.toString('base64')}`;

const fileContent = `// Automatically embedded base64 representation of Wooly Bloom logo for PDF rendering
export const LOGO_BASE64 = "${base64Data}";
`;

fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log('Successfully generated src/assets/logoBase64.js with size:', base64Data.length);
