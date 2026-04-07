/**
 * Validates and compresses an image file.
 * 
 * @param {File} file - The original image file.
 * @param {Object} options - Compression options.
 * @param {number} options.maxSizeMB - Maximum allowed size before compression.
 * @param {number} options.targetSizeKB - Ideal size after compression.
 * @param {number} options.maxWidth - Maximum width for resizing.
 * @returns {Promise<File>} - The processed image file.
 */
export const processImage = async (file, { maxSizeMB = 2, targetSizeKB = 300, maxWidth = 1200 } = {}) => {
  // 1. Validate Extension
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Formato de imagen no válido. Use JPG, PNG o WebP.');
  }

  // 2. Validate Original Size (Max 2MB)
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`La imagen es demasiado grande. Máximo ${maxSizeMB}MB.`);
  }

  // 3. Compression / Resizing
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if too wide
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Recursive function to adjust quality until target size is reached
        const compress = (quality) => {
          canvas.toBlob((blob) => {
            if (!blob) return reject(new Error('Error al procesar la imagen.'));
            
            // If quality is still high and blob is too big, reduce quality
            if (blob.size / 1024 > targetSizeKB && quality > 0.1) {
              compress(quality - 0.1);
            } else {
              const processedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(processedFile);
            }
          }, 'image/jpeg', quality);
        };

        compress(0.8); // Start with 80% quality
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen.'));
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
  });
};
