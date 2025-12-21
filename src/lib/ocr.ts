import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// In a real app, you might want to serve this locally
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function extractTextFromImage(file: File): Promise<string> {
    try {
        const result = await Tesseract.recognize(file, 'eng');
        return result.data.text;
    } catch (error) {
        console.error("Error recognizing image:", error);
        throw new Error("Failed to extract text from image");
    }
}

export async function extractTextFromPdf(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText;
    } catch (error) {
        console.error("Error parsing PDF:", error);
        throw new Error("Failed to extract text from PDF");
    }
}

export async function extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
        return extractTextFromPdf(file);
    } else if (file.type.startsWith('image/')) {
        return extractTextFromImage(file);
    }
    throw new Error("Unsupported file type");
}
