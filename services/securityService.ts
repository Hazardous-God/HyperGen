/**
 * A client-side security service to sanitize user inputs and API outputs.
 * This helps mitigate risks like prompt injection and malicious data embedding in images.
 */

/**
 * Sanitizes a text prompt to remove or neutralize common prompt injection patterns.
 * This is a client-side best-effort mitigation.
 * @param text The user-provided prompt string.
 * @returns A sanitized version of the prompt.
 */
export const sanitizeTextPrompt = (text: string): string => {
  if (!text) return '';

  let sanitizedText = text;

  // 1. Remove non-printable characters except for standard whitespace.
  // This helps prevent hidden instruction attacks.
  sanitizedText = sanitizedText.replace(/[^\x20-\x7E\n\r\t]/g, '');

  // 2. Neutralize instruction-like phrases. We replace them with a generic term
  // to disrupt the command structure without deleting the user's intent entirely.
  const injectionPatterns = [
    /ignore previous instructions/gi,
    /ignore all prior directives/gi,
    /disregard the above prompt/gi,
    /act as/gi, // A common way to start a role-play hijack
    /system prompt:/gi,
    /user prompt:/gi
  ];

  injectionPatterns.forEach(pattern => {
    sanitizedText = sanitizedText.replace(pattern, '[instruction neutralized]');
  });

  return sanitizedText;
};

/**
 * Sanitizes a base64 encoded image by drawing it onto a clean canvas
 * and re-exporting it. This process effectively strips any non-pixel data,
 * such as malicious metadata or steganographically hidden information.
 * @param base64Image The base64 data URL of the image to sanitize.
 * @returns A promise that resolves to the sanitized base64 data URL.
 */
export const sanitizeImage = (base64Image: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for canvas security

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Re-export the image from the canvas. This creates a fresh, clean image file.
      // We use PNG as it's a lossless format that's well-supported.
      const sanitizedBase64 = canvas.toDataURL('image/png');
      resolve(sanitizedBase64);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for sanitization'));
    };

    img.src = base64Image;
  });
};
