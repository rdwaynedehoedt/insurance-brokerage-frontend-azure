import imageCompression from 'browser-image-compression';

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
}

/**
 * Default compression options for different file sizes
 */
const getDefaultOptions = (fileSize: number): CompressionOptions => {
  // For very large images (>5MB)
  if (fileSize > 5 * 1024 * 1024) {
    return {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.7,
    };
  }
  // For medium images (1MB-5MB)
  else if (fileSize > 1 * 1024 * 1024) {
    return {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      initialQuality: 0.8,
    };
  }
  // For smaller images (<1MB)
  else {
    return {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.85,
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
  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    console.log('Not an image file, skipping compression:', file.name);
    return file;
  }
  
  try {
    // Get default options based on file size
    const defaultOptions = getDefaultOptions(file.size);
    
    // Merge with custom options if provided
    const options = {
      ...defaultOptions,
      ...customOptions,
    };
    
    console.log(`Compressing image ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) with options:`, options);
    
    // Compress the image
    const compressedFile = await imageCompression(file, options);
    
    console.log(
      `Compression complete: ${file.name} - Original: ${(file.size / 1024 / 1024).toFixed(2)}MB, ` +
      `Compressed: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB, ` +
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
 * Determines if a file should be compressed based on its type and size
 * @param file The file to check
 * @param minSizeKB Minimum size in KB to trigger compression (default: 100KB)
 * @returns Boolean indicating if the file should be compressed
 */
export const shouldCompressFile = (file: File, minSizeKB = 100): boolean => {
  // Only compress images
  if (!file.type.startsWith('image/')) {
    return false;
  }
  
  // Skip already small files
  if (file.size < minSizeKB * 1024) {
    return false;
  }
  
  // Skip GIFs (to preserve animation)
  if (file.type === 'image/gif') {
    return false;
  }
  
  return true;
};

/**
 * Process a file for upload, compressing images if appropriate
 * @param file The file to process
 * @param customOptions Optional custom compression options
 * @returns A Promise resolving to the processed file
 */
export const processFileForUpload = async (
  file: File,
  customOptions?: CompressionOptions
): Promise<File> => {
  if (shouldCompressFile(file)) {
    return compressImage(file, customOptions);
  }
  return file;
}; 