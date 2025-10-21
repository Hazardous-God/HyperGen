import { ImageModel } from './types';

export const MODELS = [
  { id: ImageModel.IMAGEN_4, name: 'Imagen 4 (High Quality)' },
  { id: ImageModel.GEMINI_FLASH_IMAGE, name: 'Gemini Flash Image (Fast)' },
];

export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
export const VIDEO_ASPECT_RATIOS = ["16:9", "9:16"];
export const VIDEO_RESOLUTIONS = ["720p", "1080p"];


export const STYLES = [
  "Photorealistic", "Anime", "Fantasy", "Cyberpunk", "Steampunk", "Impressionism", "Minimalist", "Concept Art", "Low Poly", "Watercolor", "Vintage", "Cinematic", "3D Render", "Pixel Art", "Graffiti", "Sticker", "Line Art", "Meme", "Surrealism", "Abstract", "Retro"
];

export const GOOGLE_FONTS = [
  'Roboto', 'Anton', 'Bangers', 'Lobster', 'Caveat', 'Press Start 2P'
];