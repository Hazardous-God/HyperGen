
import React from 'react';
import type { Scene } from '../types';

interface StoryboardCreatorProps {
  scenes: Scene[];
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
}

export const StoryboardCreator: React.FC<StoryboardCreatorProps> = ({ scenes, setScenes }) => {

  const updateScenePrompt = (id: string, prompt: string) => {
    setScenes(scenes.map(scene => scene.id === id ? { ...scene, prompt } : scene));
  };

  const addScene = () => {
    const newScene: Scene = { id: Date.now().toString(), prompt: '' };
    setScenes([...scenes, newScene]);
  };

  const removeScene = (id: string) => {
    if (scenes.length > 1) {
      setScenes(scenes.filter(scene => scene.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-200">Storyboard Scenes</h3>
      {scenes.map((scene, index) => (
        <div key={scene.id} className="flex items-start space-x-2">
            <span className="text-purple-400 font-bold mt-2">{index + 1}.</span>
            <textarea
              value={scene.prompt}
              onChange={(e) => updateScenePrompt(scene.id, e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-md border border-gray-600 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              rows={3}
              placeholder={`Prompt for scene ${index + 1}`}
            />
            <button 
              type="button" 
              onClick={() => removeScene(scene.id)} 
              disabled={scenes.length <= 1}
              className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fa-solid fa-trash-can"></i>
            </button>
        </div>
      ))}
      <button 
        type="button" 
        onClick={addScene} 
        className="w-full text-sm py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
      >
        <i className="fa-solid fa-plus mr-2"></i>Add Scene
      </button>
    </div>
  );
};
