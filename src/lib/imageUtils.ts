export const IMAGE_CONFIG = {
  THUMBNAIL_WIDTH: 300,
  MEDIUM_WIDTH: 600,
  FULL_WIDTH: 1200,
  MAX_SIZE_KB: 300,
  QUALITY: 0.75
};

/**
 * Compresses an image file using browser Canvas and returns a Blob.
 */
export async function compressImage(
  file: File, 
  maxWidth: number = IMAGE_CONFIG.FULL_WIDTH, 
  quality: number = IMAGE_CONFIG.QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.src = objectUrl;
    
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Handle extreme ratios if needed, but here we just respect aspect ratio
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better JPEG/WebP compression
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      // Fill with white background (useful for PNG with transparency being converted to WebP/JPG)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      try {
        // Prefer WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          'image/webp',
          quality
        );
      } catch (err) {
        reject(new Error('Error during canvas compression: ' + (err instanceof Error ? err.message : String(err))));
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image. The file might be corrupted or in an unsupported format.'));
    };
  });
}

/**
 * Creates multiple variants of an image for optimization.
 */
export async function generateImageVariants(file: File) {
  const [thumbnail, medium, full] = await Promise.all([
    compressImage(file, IMAGE_CONFIG.THUMBNAIL_WIDTH, 0.7),
    compressImage(file, IMAGE_CONFIG.MEDIUM_WIDTH, 0.75),
    compressImage(file, IMAGE_CONFIG.FULL_WIDTH, IMAGE_CONFIG.QUALITY)
  ]);

  return { thumbnail, medium, full };
}

/**
 * Checks if a file is an allowed image format.
 */
export function isValidImageFormat(file: File): boolean {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  return allowed.includes(file.type.toLowerCase()) || 
         /\.(jpg|jpeg|png|webp)$/i.test(file.name);
}
