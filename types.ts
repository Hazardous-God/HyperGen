export interface Scene {
  id: string;
  prompt: string;
}

export enum ImageModel {
  IMAGEN_4 = 'imagen-4.0-generate-001',
  GEMINI_FLASH_IMAGE = 'gemini-2.5-flash-image',
}

export interface GenerationConfig {
  prompt: string;
  negativePrompt: string;
  model: ImageModel;
  aspectRatio: string;
  numberOfImages: number;
  isOptimizerEnabled: boolean;
  styles: string[];
  scenes: Scene[];
  activeTab: 'single' | 'storyboard' | 'video';
  videoResolution: string;
  referenceImage: string | null; // Base64 encoded image
}

export type MediaItem = {
  type: 'image';
  src: string; // Base64 encoded image
} | {
  type: 'video';
  src: string; // Object URL for the video blob
};


// This is to make the gif.js library available in the window scope with types
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    GIF: any;
    // FIX: Made 'aistudio' optional to resolve the "All declarations of 'aistudio' must have identical modifiers" error.
    // This aligns this declaration with its usage in the application where it is conditionally checked.
    aistudio?: AIStudio;
  }
}