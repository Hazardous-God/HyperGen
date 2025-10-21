import { GoogleGenAI, Modality, GenerateContentResponse, Part } from "@google/genai";
import type { GenerationConfig, ImageModel } from "../types";
import { sanitizeImage } from './securityService';

const getAIClient = () => {
  if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable is not set. Please select a key in the application.");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const base64ToPart = (base64Data: string): Part => {
    const match = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid base64 string");
    const mimeType = match[1];
    const data = match[2];
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
}


export const optimizePrompt = async (
  prompt: string,
  negativePrompt: string,
  model: string,
  styles: string[],
  consistencyNotes?: string,
  hasReferenceImage?: boolean,
): Promise<string> => {
  const ai = getAIClient();
  let optimizationRequest = `Optimize the following image generation prompt for the "${model}" model. The user wants to create a visually stunning and coherent image.\n\n`;
  optimizationRequest += `**Base Prompt:** "${prompt}"\n`;
  if (hasReferenceImage) {
      optimizationRequest += `**Reference Image:** A reference image is provided. Ensure the generated image's style, subject, and composition are heavily inspired by it.\n`;
  }
  if (styles.length > 0) {
    optimizationRequest += `**Desired Styles:** ${styles.join(", ")}\n`;
  }
  if (negativePrompt) {
    optimizationRequest += `**Negative Prompt (things to avoid):** ${negativePrompt}\n`;
  }
  if (consistencyNotes) {
    optimizationRequest += `**Consistency Notes from previous scene:** ${consistencyNotes}\n`;
  }
  optimizationRequest += `\n**Instructions:** Rewrite the prompt to be highly descriptive, detailed, and structured for the best possible output from the AI image generator. Incorporate the styles and avoid the negative elements. Focus on composition, lighting, color, and mood. The output should be ONLY the final, optimized prompt string, without any additional explanation or labels.`;
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: optimizationRequest
  });
  
  return response.text.trim();
};

interface GenerateImagesParams {
  prompt: string;
  model: ImageModel;
  numberOfImages: number;
  aspectRatio: string;
  referenceImage?: string | null; // Base64
}

export const generateImages = async ({ prompt, model, numberOfImages, aspectRatio, referenceImage }: GenerateImagesParams): Promise<string[]> => {
  const ai = getAIClient();
  const images: string[] = [];
  
  if (model === 'imagen-4.0-generate-001') {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: numberOfImages,
          aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
          outputMimeType: 'image/png',
        },
    });
    // The response is already base64, but we add the data URL prefix for consistency
    response.generatedImages.forEach(img => {
      images.push(`data:image/png;base64,${img.image.imageBytes}`);
    });
  } else {
    // gemini-2.5-flash-image
    const parts: Part[] = [{ text: prompt }];
    if (referenceImage) {
        parts.unshift(base64ToPart(referenceImage));
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
      }
    }
  }

  // Sanitize all generated images before returning them to the app
  const sanitizedImages = await Promise.all(images.map(img => sanitizeImage(img)));
  return sanitizedImages;
};

export const generateStoryboardImages = async (
    config: GenerationConfig, 
    setLoadingMessage: (message: string) => void
): Promise<string[]> => {
    const allImages: string[] = [];
    let previousOptimizedPrompt = "";

    const useReferenceImage = config.referenceImage && config.model === 'gemini-2.5-flash-image';

    for (let i = 0; i < config.scenes.length; i++) {
        const scene = config.scenes[i];
        setLoadingMessage(`Processing scene ${i + 1}/${config.scenes.length}...`);

        let finalPrompt = scene.prompt;
        if (config.isOptimizerEnabled) {
            setLoadingMessage(`Optimizing prompt for scene ${i + 1}...`);
            finalPrompt = await optimizePrompt(
                scene.prompt,
                config.negativePrompt,
                config.model,
                config.styles,
                i > 0 ? `The previous scene's prompt was: "${previousOptimizedPrompt}". Maintain character, environment, and art style consistency.` : undefined,
                useReferenceImage
            );
            previousOptimizedPrompt = finalPrompt;
        } else {
            let combinedPrompt = scene.prompt;
            if (config.styles.length > 0) {
                combinedPrompt += `, in the style of ${config.styles.join(', ')}`;
            }
            if (config.negativePrompt) {
                combinedPrompt += `. Avoid: ${config.negativePrompt}.`;
            }
            if (i > 0 || useReferenceImage) {
                 combinedPrompt += ` Maintain consistency with the reference image and previous scene.`
            }
            finalPrompt = combinedPrompt;
        }
        
        setLoadingMessage(`Generating image for scene ${i + 1}...`);
        const generatedSceneImages = await generateImages({
            prompt: finalPrompt,
            model: config.model,
            numberOfImages: 1, // one image per scene for storyboards
            aspectRatio: config.aspectRatio,
            referenceImage: useReferenceImage ? config.referenceImage : null,
        });
        allImages.push(...generatedSceneImages);
    }
    return allImages;
};

export const generateVideo = async (
    config: GenerationConfig,
    setLoadingMessage: (message: string) => void
): Promise<string | null> => {
    const ai = getAIClient();
    setLoadingMessage("Starting video generation... This may take a few minutes.");

    const imagePayload = config.referenceImage ? base64ToPart(config.referenceImage).inlineData : undefined;

    let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: config.prompt,
        image: imagePayload ? { imageBytes: imagePayload.data, mimeType: imagePayload.mimeType } : undefined,
        config: {
            numberOfVideos: 1,
            resolution: config.videoResolution as '720p' | '1080p',
            aspectRatio: config.aspectRatio as '16:9' | '9:16',
        }
    });

    setLoadingMessage("Video generation in progress... Polling for results.");
    
    let pollCount = 0;
    while (!operation.done) {
        pollCount++;
        setLoadingMessage(`Checking status (attempt ${pollCount})... Still processing.`);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    setLoadingMessage("Video processed! Fetching final result...");

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch video: ${response.statusText}`);
        }
        const videoBlob = await response.blob();
        return URL.createObjectURL(videoBlob);
    }

    return null;
}