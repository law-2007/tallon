import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configure PDF.js worker for version 3.x
// Explicitly setting workerSrc to UNPKG with correct version
import mammoth from 'mammoth';

// Configure PDF.js worker for version 3.x
// Explicitly setting workerSrc to UNPKG with correct version
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

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

        // Use standard v3 loading
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

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
        throw new Error("Failed to extract text from PDF: " + (error instanceof Error ? error.message : String(error)));
    }
}

export async function extractTextFromDocx(file: File): Promise<string> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error("Error parsing DOCX:", error);
        throw new Error("Failed to extract text from DOCX");
    }
}

export async function extractTextFromTxt(file: File): Promise<string> {
    try {
        return await file.text();
    } catch (error) {
        console.error("Error reading text file:", error);
        throw new Error("Failed to read text file");
    }
}

export async function extractText(file: File): Promise<string> {
    if (file.type === 'application/pdf') {
        return extractTextFromPdf(file);
    } else if (file.type.startsWith('image/')) {
        return extractTextFromImage(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return extractTextFromDocx(file);
    } else if (file.type === 'text/plain') {
        return extractTextFromTxt(file);
    }
    throw new Error("Unsupported file type: " + file.type);
}
