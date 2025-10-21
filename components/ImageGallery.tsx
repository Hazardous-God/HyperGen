import React, { useState, useEffect, useCallback } from 'react';
import { Loader } from './Loader';
import { ImageEditor } from './ImageEditor';
import { MediaItem } from '../types';

interface MediaGalleryProps {
  media: MediaItem[];
  isLoading: boolean;
  loadingMessage: string;
  error: string | null;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ media, isLoading, loadingMessage, error }) => {
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [editingImage, setEditingImage] = useState<{ index: number; src: string } | null>(null);
  const [animating, setAnimating] = useState(false);
  const [animatedGif, setAnimatedGif] = useState<string | null>(null);

  const isStoryboard = media.length > 1 && media.every(item => item.type === 'image');
  const videoItem = media.find(item => item.type === 'video');

  useEffect(() => {
    setLocalImages(media.filter(item => item.type === 'image').map(item => item.src));
    setAnimatedGif(null);
    setEditingImage(null);
  }, [media]);

  const handleSaveEdit = (newImageSrc: string) => {
    if (editingImage) {
      const updatedImages = [...localImages];
      updatedImages[editingImage.index] = newImageSrc;
      setLocalImages(updatedImages);
    }
    setEditingImage(null);
  };

  const handleCancelEdit = () => {
    setEditingImage(null);
  };

  const createAnimation = useCallback(() => {
    if (localImages.length < 2) return;

    setAnimating(true);
    setAnimatedGif(null);

    const imageElements: HTMLImageElement[] = [];
    let loadedImages = 0;

    const onImageLoad = () => {
      loadedImages++;
      if (loadedImages === localImages.length) {
        const firstImage = imageElements[0];
        const gif = new window.GIF({
          workers: 2,
          quality: 10,
          width: firstImage.width,
          height: firstImage.height,
        });

        imageElements.forEach(img => {
          gif.addFrame(img, { delay: 500 });
        });
        
        gif.on('finished', (blob: Blob) => {
          setAnimatedGif(URL.createObjectURL(blob));
          setAnimating(false);
        });

        gif.render();
      }
    };
    
    localImages.forEach(base64Image => {
      const img = new Image();
      img.onload = onImageLoad;
      img.src = base64Image;
      imageElements.push(img);
    });

  }, [localImages]);

  const renderContent = () => {
    if (isLoading) {
      return <Loader message={loadingMessage} />;
    }
    if (error) {
      return <div className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg"><i className="fa-solid fa-circle-exclamation mr-2"></i>Error: {error}</div>;
    }
    if (editingImage) {
      return <ImageEditor imageSrc={editingImage.src} onSave={(newSrc) => handleSaveEdit(newSrc)} onCancel={handleCancelEdit} />;
    }
    if (animatedGif) {
      return (
        <div className="text-center">
            <img src={animatedGif} alt="Animated Storyboard" className="max-w-full max-h-[80vh] mx-auto rounded-lg shadow-lg" />
            <button onClick={() => setAnimatedGif(null)} className="mt-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Back to Images</button>
        </div>
      );
    }
    if (videoItem) {
        return (
            <div className="w-full">
                <video src={videoItem.src} controls autoPlay loop className="max-w-full max-h-[80vh] mx-auto rounded-lg shadow-lg" />
            </div>
        )
    }
    if (localImages.length > 0) {
      return (
        <>
          {isStoryboard && (
            <div className="text-center mb-4">
              <button 
                onClick={createAnimation}
                disabled={animating}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                {animating ? 'Creating Animation...' : <><i className="fa-solid fa-film mr-2"></i>Create Animation</>}
              </button>
            </div>
          )}
          <div className={`grid gap-4 ${localImages.length > 1 ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
            {localImages.map((imgSrc, index) => (
              <div key={index} className="bg-gray-800 p-2 rounded-lg shadow-lg group relative">
                <img
                  src={imgSrc}
                  alt={`Generated art ${index + 1}`}
                  className="w-full h-auto rounded-md object-contain"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <a 
                    href={imgSrc}
                    download={`hypergen-studio-${Date.now()}.png`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-full h-12 w-12 flex items-center justify-center"
                    title="Save Image"
                  >
                    <i className="fa-solid fa-download"></i>
                  </a>
                  <button 
                    onClick={() => setEditingImage({ index, src: imgSrc })}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded-full h-12 w-12 flex items-center justify-center"
                    title="Add Text"
                  >
                    <i className="fa-solid fa-pencil"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }
    return (
      <div className="text-center text-gray-400">
        <i className="fa-solid fa-image text-6xl mb-4"></i>
        <h2 className="text-2xl font-semibold">Your creations will appear here</h2>
        <p>Configure your settings and click 'Generate' to begin.</p>
      </div>
    );
  };

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg min-h-[80vh] flex items-center justify-center">
      {renderContent()}
    </div>
  );
};