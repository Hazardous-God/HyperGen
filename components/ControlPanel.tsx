import React, { useState, useCallback, useEffect } from 'react';
import type { GenerationConfig, Scene, ImageModel } from '../types';
import { MODELS, ASPECT_RATIOS, STYLES, VIDEO_ASPECT_RATIOS, VIDEO_RESOLUTIONS, NEGATIVE_PROMPT_PRESETS } from '../constants';
import { ToggleSwitch } from './ToggleSwitch';
import { StoryboardCreator } from './StoryboardCreator';
import { fileToBase64 } from '../services/geminiService';
import { sanitizeTextPrompt, sanitizeImage } from '../services/securityService';


interface ControlPanelProps {
  onGenerate: (config: GenerationConfig) => void;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onGenerate, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'single' | 'storyboard' | 'video'>('single');
  const [prompt, setPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [customNegativePrompt, setCustomNegativePrompt] = useState<string>('');
  const [activeNegativePresets, setActiveNegativePresets] = useState<string[]>([]);
  const [model, setModel] = useState<ImageModel>(MODELS[0].id);
  const [aspectRatio, setAspectRatio] = useState<string>(ASPECT_RATIOS[1]);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>(VIDEO_ASPECT_RATIOS[0]);
  const [videoResolution, setVideoResolution] = useState<string>(VIDEO_RESOLUTIONS[0]);
  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [isOptimizerEnabled, setIsOptimizerEnabled] = useState<boolean>(true);
  const [styles, setStyles] = useState<string[]>([]);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([
    { id: '1', prompt: 'A knight stands before a giant, glowing castle gate at dusk.' },
    { id: '2', prompt: 'The knight enters the castle, revealing a grand, empty throne room.' },
    { id: '3', prompt: 'A mysterious figure emerges from the shadows behind the throne.' }
  ]);
  
  // Combine presets and custom text into the final negative prompt
  useEffect(() => {
    const presetPrompts = NEGATIVE_PROMPT_PRESETS
      .filter(p => activeNegativePresets.includes(p.label))
      .map(p => p.prompt)
      .join(', ');

    const combined = [presetPrompts, customNegativePrompt].filter(Boolean).join(', ');
    setNegativePrompt(combined);
  }, [activeNegativePresets, customNegativePrompt]);

  const handleStyleToggle = (style: string) => {
    setStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  const handleNegativePresetToggle = (label: string) => {
    setActiveNegativePresets(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      // Sanitize the uploaded image to strip metadata before use
      const sanitizedBase64 = await sanitizeImage(base64);
      setReferenceImage(sanitizedBase64);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sanitize all text inputs before generation
    const sanitizedPrompt = sanitizeTextPrompt(prompt);
    const sanitizedNegativePrompt = sanitizeTextPrompt(negativePrompt);
    const sanitizedScenes = scenes.map(scene => ({
      ...scene,
      prompt: sanitizeTextPrompt(scene.prompt),
    }));

    onGenerate({
      prompt: sanitizedPrompt,
      negativePrompt: sanitizedNegativePrompt,
      model,
      aspectRatio: activeTab === 'video' ? videoAspectRatio : aspectRatio,
      numberOfImages,
      isOptimizerEnabled,
      styles,
      scenes: sanitizedScenes,
      activeTab,
      videoResolution,
      referenceImage,
    });
  };

  const isImagen = model === 'imagen-4.0-generate-001';
  const isFlashImage = model === 'gemini-2.5-flash-image';

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-2xl h-full flex flex-col">
      <div className="flex border-b border-gray-700 mb-4">
        <button 
          onClick={() => { setActiveTab('single'); setReferenceImage(null); }} 
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'single' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          Image
        </button>
        <button 
          onClick={() => { setActiveTab('storyboard'); setReferenceImage(null); }} 
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'storyboard' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          Storyboard
        </button>
        <button 
          onClick={() => { setActiveTab('video'); setReferenceImage(null); }} 
          className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'video' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          Video
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-grow space-y-4 overflow-y-auto pr-2">
        {(activeTab === 'single' || activeTab === 'video') && (
          <>
            <label className="text-gray-300">Prompt</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              rows={4}
              placeholder={activeTab === 'video' ? "e.g., A cinematic shot of a car driving on a rainy night" : "e.g., An astronaut riding a horse on Mars"}
            />
          </>
        )}

        {activeTab === 'storyboard' && <StoryboardCreator scenes={scenes} setScenes={setScenes} />}

        {(activeTab === 'storyboard' || activeTab === 'video') && (
            <div>
                <label className="text-gray-300">Reference Image (Optional)</label>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"/>
                {referenceImage && <img src={referenceImage} alt="Reference preview" className="mt-2 rounded-lg max-h-32" />}
                {activeTab === 'storyboard' && !isFlashImage && <p className="text-xs text-yellow-400 mt-1">Reference image is only available for the Gemini Flash Image model in storyboards.</p>}
            </div>
        )}
      
        <label className="text-gray-300">Negative Prompt</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {NEGATIVE_PROMPT_PRESETS.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleNegativePresetToggle(preset.label)}
              className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${activeNegativePresets.includes(preset.label) ? 'bg-red-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <textarea
            value={customNegativePrompt}
            onChange={e => setCustomNegativePrompt(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            rows={2}
            placeholder="Add custom negatives (e.g., blurry, text)"
        />

        {activeTab !== 'video' && (
           <>
            <label htmlFor="model" className="text-gray-300">Model</label>
            <select
                id="model"
                value={model}
                onChange={e => setModel(e.target.value as ImageModel)}
                className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
           </>
        )}
        
        {activeTab === 'single' && isImagen && (
             <>
                <label className="text-gray-300">Number of Images: {numberOfImages}</label>
                <input
                    type="range"
                    min="1"
                    max="4"
                    value={numberOfImages}
                    onChange={e => setNumberOfImages(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
             </>
        )}
        
        {activeTab !== 'video' && (
          <>
            <label className="text-gray-300">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map(ar => (
                    <button
                        key={ar}
                        type="button"
                        onClick={() => setAspectRatio(ar)}
                        className={`p-2 text-xs rounded-md border transition-colors duration-200 ${aspectRatio === ar ? 'bg-purple-600 border-purple-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'} ${!isImagen ? 'cursor-not-allowed opacity-50' : ''}`}
                        disabled={!isImagen}
                    >
                        {ar}
                    </button>
                ))}
            </div>
            {!isImagen && <p className="text-xs text-yellow-400">Aspect ratio and multiple images are only available for Imagen 4.</p>}
          </>
        )}
        
        {activeTab === 'video' && (
            <>
                <label className="text-gray-300">Video Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                    {VIDEO_ASPECT_RATIOS.map(ar => (
                        <button
                            key={ar}
                            type="button"
                            onClick={() => setVideoAspectRatio(ar)}
                            className={`p-2 text-sm rounded-md border transition-colors duration-200 ${videoAspectRatio === ar ? 'bg-purple-600 border-purple-500' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                        >
                            {ar}
                        </button>
                    ))}
                </div>
                 <label htmlFor="resolution" className="text-gray-300">Resolution</label>
                <select
                    id="resolution"
                    value={videoResolution}
                    onChange={e => setVideoResolution(e.target.value)}
                    className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {VIDEO_RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </>
        )}


        {activeTab !== 'video' && (
          <>
            <label className="text-gray-300">Styles</label>
            <div className="flex flex-wrap gap-2">
                {STYLES.map(s => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => handleStyleToggle(s)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${styles.includes(s) ? 'bg-green-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {s}
                    </button>
                ))}
            </div>
            <ToggleSwitch
                label="AI Prompt Optimizer"
                enabled={isOptimizerEnabled}
                setEnabled={setIsOptimizerEnabled}
            />
          </>
        )}

        <div className="flex-grow"></div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-auto bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            <>
              <i className="fa-solid fa-bolt mr-2"></i>
              Generate
            </>
          )}
        </button>
      </form>
    </div>
  );
};