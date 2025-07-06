import imageCompression from 'browser-image-compression';
import { PDFDocument } from 'pdf-lib';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  maxIteration?: number;
  exifOrientation?: number;
  fileType?: string;
  initialQuality?: number;
  alwaysKeepResolution?: boolean;
  onProgress?: (progress: number) => void;
  targetSizeKB?: number;
}

/**
 * Default compression options for different file sizes
 */
const getDefaultOptions = (fileSize: number, targetSizeKB = 50): CompressionOptions => {
  const targetSizeMB = targetSizeKB / 1024;
  
  // For very large images (>5MB)
  if (fileSize > 5 * 1024 * 1024) {
    return {
      maxSizeMB: Math.min(1, targetSizeMB),
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.6,
      targetSizeKB,
    };
  }
  // For medium images (1MB-5MB)
  else if (fileSize > 1 * 1024 * 1024) {
    return {
      maxSizeMB: Math.min(0.5, targetSizeMB),
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      initialQuality: 0.7,
      targetSizeKB,
    };
  }
  // For smaller images (<1MB)
  else {
    return {
      maxSizeMB: Math.min(0.3, targetSizeMB),
      maxWidthOrHeight: 800,
      useWebWorker: true,
      initialQuality: 0.75,
      targetSizeKB,
    };
  }
};

/**
 * Compresses an image file using browser-image-compression
 * @param file The image file to compress
 * @param customOptions Optional custom compression options
 * @returns A Promise resolving to the compressed file
 */
export const compressImage = async (
  file: File,
  customOptions?: CompressionOptions
): Promise<File> => {
  try {
    // Get default options based on file size
    const defaultOptions = getDefaultOptions(file.size, customOptions?.targetSizeKB);
    
    // Merge with custom options if provided
    const options = {
      ...defaultOptions,
      ...customOptions,
    };
    
    console.log(`Compressing image ${file.name} (${(file.size / 1024).toFixed(2)}KB) with options:`, options);
    
    // Compress the image
    const compressedFile = await imageCompression(file, options);
    
    console.log(
      `Compression complete: ${file.name} - Original: ${(file.size / 1024).toFixed(2)}KB, ` +
      `Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB, ` +
      `Reduction: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
    );
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return the original file if compression fails
    return file;
  }
};

/**
 * Compresses a PDF file using pdf-lib
 * @param file The PDF file to compress
 * @param targetSizeKB Target size in KB
 * @returns A Promise resolving to the compressed file
 */
export const compressPDF = async (
  file: File,
  targetSizeKB = 50
): Promise<File> => {
  try {
    console.log(`Compressing PDF ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
    
    // Read the PDF file
    const fileArrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(fileArrayBuffer);
    
    // Try different compression levels until we get close to target size
    let compressedBytes: Uint8Array;
    let quality = 0.8;
    
    // First attempt with medium quality
    compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
    });
    
    // If still too large, try with more aggressive settings
    if (compressedBytes.length > targetSizeKB * 1024) {
      // Create a new PDF with fewer pages if original is very large
      const newPdfDoc = await PDFDocument.create();
      
      // Copy pages with reduced quality
      const pageCount = pdfDoc.getPageCount();
      const pagesToKeep = Math.min(pageCount, Math.max(1, Math.floor(targetSizeKB / (file.size / 1024) * pageCount)));
      
      for (let i = 0; i < pagesToKeep; i++) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }
      
      compressedBytes = await newPdfDoc.save({
        useObjectStreams: true,
      });
      
      // Add a note if pages were removed
      if (pagesToKeep < pageCount) {
        console.warn(`PDF was too large. Reduced from ${pageCount} to ${pagesToKeep} pages.`);
      }
    }
    
    const compressedFile = new File([compressedBytes], file.name, { type: file.type });
    
    console.log(
      `PDF compression complete: ${file.name} - Original: ${(file.size / 1024).toFixed(2)}KB, ` +
      `Compressed: ${(compressedFile.size / 1024).toFixed(2)}KB, ` +
      `Reduction: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
    );
    
    return compressedFile;
  } catch (error) {
    console.error('Error compressing PDF:', error);
    // Return the original file if compression fails
    return file;
  }
};

/**
 * Determines if a file should be compressed based on its type and size
 * @param file The file to check
 * @param minSizeKB Minimum size in KB to trigger compression (default: 50KB)
 * @returns Boolean indicating if the file should be compressed
 */
export const shouldCompressFile = (file: File, minSizeKB = 50): boolean => {
  // Skip already small files
  if (file.size <= minSizeKB * 1024) {
    return false;
  }
  
  // Skip GIFs (to preserve animation)
  if (file.type === 'image/gif') {
    return false;
  }
  
  // Compress images and PDFs
  if (file.type.startsWith('image/') || file.type === 'application/pdf') {
    return true;
  }
  
  return false;
};

/**
 * Process a file for upload, compressing if appropriate
 * @param file The file to process
 * @param customOptions Optional custom compression options
 * @returns A Promise resolving to the processed file
 */
export const processFileForUpload = async (
  file: File,
  customOptions?: CompressionOptions
): Promise<File> => {
  const targetSizeKB = customOptions?.targetSizeKB || 50;
  
  // If file is already under target size, return as is
  if (file.size <= targetSizeKB * 1024) {
    console.log(`File ${file.name} is already under ${targetSizeKB}KB (${(file.size / 1024).toFixed(2)}KB)`);
    return file;
  }
  
  // Handle different file types
  if (file.type.startsWith('image/')) {
    return compressImage(file, customOptions);
  } else if (file.type === 'application/pdf') {
    return compressPDF(file, targetSizeKB);
  } else {
    console.warn(`File type ${file.type} cannot be compressed. Using original file.`);
    return file;
  }
}; 