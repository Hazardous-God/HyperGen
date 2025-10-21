import React, { useState, useRef, useEffect } from 'react';
import { GOOGLE_FONTS } from '../constants';

interface ImageEditorProps {
    imageSrc: string;
    onSave: (newImageSrc: string) => void;
    onCancel: () => void;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const [text, setText] = useState('Your Text Here');
    const [font, setFont] = useState('Anton');
    const [fontSize, setFontSize] = useState(80);
    const [fontColor, setFontColor] = useState('#FFFFFF');
    const [position, setPosition] = useState({ x: 50, y: 15 });

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const img = imageRef.current;

        if (!canvas || !ctx || !img) return;

        // Set canvas dimensions to image dimensions
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Draw image
        ctx.drawImage(img, 0, 0);

        // Draw text
        ctx.font = `${fontSize}px ${font}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';

        // Add a simple stroke for better visibility (classic meme style)
        ctx.strokeStyle = 'black';
        ctx.lineWidth = Math.max(1, fontSize / 20);

        const xPos = (canvas.width * position.x) / 100;
        const yPos = (canvas.height * position.y) / 100;
        
        ctx.strokeText(text, xPos, yPos);
        ctx.fillText(text, xPos, yPos);
    };

    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageSrc.startsWith('data:') ? imageSrc : `data:image/png;base64,${imageSrc}`;
        img.onload = () => {
            imageRef.current = img;
            drawCanvas();
        };
    }, [imageSrc]);

    useEffect(() => {
        drawCanvas();
    }, [text, font, fontSize, fontColor, position]);


    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL('image/png'));
        }
    };
    
    return (
        <div className="w-full h-full flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-grow flex items-center justify-center p-2 bg-gray-900 rounded-lg">
                <canvas ref={canvasRef} className="max-w-full max-h-[75vh] object-contain rounded-md" />
            </div>
            <div className="w-full md:w-72 bg-gray-800 p-4 rounded-lg space-y-4 flex-shrink-0">
                <h3 className="text-xl font-bold text-center text-purple-400">Text Editor</h3>
                
                <div>
                    <label className="text-sm font-medium text-gray-300">Text</label>
                    <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md border border-gray-600" />
                </div>
                
                <div>
                    <label className="text-sm font-medium text-gray-300">Font</label>
                    <select value={font} onChange={e => setFont(e.target.value)} className="w-full mt-1 p-2 bg-gray-700 rounded-md border border-gray-600">
                        {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-grow">
                        <label className="text-sm font-medium text-gray-300">Size: {fontSize}px</label>
                        <input type="range" min="10" max="200" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full mt-1" />
                    </div>
                    <div>
                         <label className="text-sm font-medium text-gray-300">Color</label>
                         <input type="color" value={fontColor} onChange={e => setFontColor(e.target.value)} className="w-12 h-10 mt-1 p-1 bg-gray-700 border border-gray-600 rounded-md cursor-pointer" />
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-300">Position X: {position.x}</label>
                    <input type="range" min="0" max="100" value={position.x} onChange={e => setPosition(p => ({...p, x: Number(e.target.value)}))} className="w-full" />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-300">Position Y: {position.y}</label>
                    <input type="range" min="0" max="100" value={position.y} onChange={e => setPosition(p => ({...p, y: Number(e.target.value)}))} className="w-full" />
                </div>
                
                <div className="flex gap-2 pt-4">
                    <button onClick={onCancel} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Cancel</button>
                    <button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">Save</button>
                </div>
            </div>
        </div>
    );
};
