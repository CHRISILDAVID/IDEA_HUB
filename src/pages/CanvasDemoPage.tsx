import React, { useState } from 'react';
import { CanvasEditor } from '../components/Canvas/CanvasEditor';
import { CanvasToolbar, CanvasTool } from '../components/Canvas/CanvasToolbar';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'diamond' | 'polygon' | 'connector' | 'arrow' | 'frame';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  cornerRadius?: number;
  opacity: number;
  rotation?: number;
  points?: number[];
  startArrow?: string;
  endArrow?: string;
  connectorType?: 'straight' | 'elbow' | 'curved';
  effects?: {
    dropShadow?: {
      enabled: boolean;
      x: number;
      y: number;
      blur: number;
      color: string;
    };
  };
}

export const CanvasDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [canvasObjects, setCanvasObjects] = useState<CanvasObject[]>([]);

  const handleObjectsChange = (objects: CanvasObject[]) => {
    setCanvasObjects(objects);
    console.log('Canvas objects updated:', objects);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Canvas Editor Demo
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enhanced vector design and diagramming tool
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {canvasObjects.length} objects
            </div>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Canvas Toolbar */}
        <CanvasToolbar 
          activeTool={activeTool} 
          onToolSelect={setActiveTool} 
        />
        
        {/* Canvas Editor */}
        <div className="flex-1">
          <CanvasEditor
            initialObjects={canvasObjects}
            readOnly={false}
            onObjectsChange={handleObjectsChange}
            activeTool={activeTool}
            onToolSelect={setActiveTool}
          />
        </div>
      </div>
    </div>
  );
}; 