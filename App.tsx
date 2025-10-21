
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { MediaGallery } from './components/ImageGallery';
import { optimizePrompt, generateImages, generateStoryboardImages, generateVideo } from './services/geminiService';
import type { GenerationConfig, ImageModel, Scene, MediaItem } from './types';
import { MODELS } from './constants';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [mediaResults, setMediaResults] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (config: GenerationConfig) => {
    setIsLoading(true);
    setError(null);
    setMediaResults([]);

    try {
      if (config.activeTab === 'single') {
        setLoadingMessage('Optimizing prompt...');
        let finalPrompt = config.prompt;
        if (config.isOptimizerEnabled) {
          finalPrompt = await optimizePrompt(
            config.prompt,
            config.negativePrompt,
            config.model,
            config.styles
          );
        } else {
            let combinedPrompt = config.prompt;
            if (config.styles.length > 0) {
                combinedPrompt += `, in the style of ${config.styles.join(', ')}`;
            }
            if (config.negativePrompt) {
                combinedPrompt += `. Avoid: ${config.negativePrompt}.`;
            }
            finalPrompt = combinedPrompt;
        }

        setLoadingMessage(`Generating with ${config.model}...`);
        const images = await generateImages({
          prompt: finalPrompt,
          model: config.model,
          numberOfImages: config.numberOfImages,
          aspectRatio: config.aspectRatio,
        });
        setMediaResults(images.map(src => ({ type: 'image', src })));
      } else if (config.activeTab === 'storyboard') {
        const images = await generateStoryboardImages(config, (message) => setLoadingMessage(message));
        setMediaResults(images.map(src => ({ type: 'image', src })));
      } else { // Video
        if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
            setLoadingMessage('Please select an API key to generate videos.');
            await window.aistudio.openSelectKey();
        }
        setLoadingMessage('Preparing video generation...');
        const videoSrc = await generateVideo(config, (message) => setLoadingMessage(message));
        if (videoSrc) {
          setMediaResults([{ type: 'video', src: videoSrc }]);
        }
      }
    } catch (err) {
      console.error(err);
      let errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      // As per guidelines, if the API key is invalid, prompt the user to select a new one.
      if (errorMessage.includes("API key not valid") || errorMessage.includes("Requested entity was not found")) {
        errorMessage = "Your API key seems to be invalid. Please select a new API key to continue.";
        if (window.aistudio) {
            // Re-open the key selection dialog for the user
            window.aistudio.openSelectKey();
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header />
      <main className="flex flex-col md:flex-row p-4 gap-4">
        <div className="w-full md:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0">
          <ControlPanel onGenerate={handleGenerate} isLoading={isLoading} />
        </div>
        <div className="w-full md:w-2/3 lg:w-3/4 xl:w-4/5">
          <MediaGallery 
            media={mediaResults} 
            isLoading={isLoading} 
            loadingMessage={loadingMessage} 
            error={error} 
          />
        </div>
      </main>
    </div>
  );
};

export default App;
