
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 shadow-lg p-4 flex items-center">
      <i className="fa-solid fa-wand-magic-sparkles text-3xl text-purple-400 mr-4"></i>
      <h1 className="text-2xl font-bold text-white tracking-wider">HyperGen Studio</h1>
    </header>
  );
};
