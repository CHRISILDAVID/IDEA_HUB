import React from 'react';
import {
  MousePointer,
  StickyNote,
  Square,
  Circle,
  Diamond,
  Minus,
  Pen,
  Type,
  Image,
  MessageSquare,
  ArrowRight,
  Hand,
  Frame,
  ChevronDown,
  Hexagon,
  ArrowUpRight
} from 'lucide-react';

export type CanvasTool =
  | 'select'
  | 'frame'
  | 'sticky'
  | 'shapes'
  | 'rectangle'
  | 'circle'
  | 'diamond'
  | 'polygon'
  | 'connector'
  | 'line'
  | 'arrow'
  | 'pen'
  | 'text'
  | 'image'
  | 'comment'
  | 'hand';

interface CanvasToolbarProps {
  activeTool: CanvasTool;
  onToolSelect: (tool: CanvasTool) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ activeTool, onToolSelect }) => {
  const [showShapes, setShowShapes] = React.useState(false);

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
      <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 space-y-1">
        {/* Select Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'select' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Select (V)"
          onClick={() => onToolSelect('select')}
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* Frame Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'frame' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Frame Tool (F)"
          onClick={() => onToolSelect('frame')}
        >
          <Frame className="w-4 h-4" />
        </button>

        {/* Hand/Pan Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'hand' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Hand Tool (H)"
          onClick={() => onToolSelect('hand')}
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-gray-200 dark:bg-gray-700" />

        {/* Shapes flyout */}
        <div className="relative group">
          <button
            className={`p-2 rounded transition-colors ${['rectangle','circle','diamond','polygon','shapes'].includes(activeTool) ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            title="Shapes (R)"
            onClick={() => setShowShapes((v) => !v)}
            onBlur={() => setTimeout(() => setShowShapes(false), 200)}
          >
            <Square className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 absolute -bottom-1 -right-1" />
          </button>
          {showShapes && (
            <div className="absolute left-full ml-2 top-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg flex flex-col min-w-[120px] p-1">
              <button 
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 flex items-center space-x-2 rounded text-sm" 
                onClick={() => { onToolSelect('rectangle'); setShowShapes(false); }}
              >
                <Square className="w-4 h-4" />
                <span>Rectangle</span>
              </button>
              <button 
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 flex items-center space-x-2 rounded text-sm" 
                onClick={() => { onToolSelect('circle'); setShowShapes(false); }}
              >
                <Circle className="w-4 h-4" />
                <span>Ellipse</span>
              </button>
              <button 
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 flex items-center space-x-2 rounded text-sm" 
                onClick={() => { onToolSelect('diamond'); setShowShapes(false); }}
              >
                <Diamond className="w-4 h-4" />
                <span>Diamond</span>
              </button>
              <button 
                className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 flex items-center space-x-2 rounded text-sm" 
                onClick={() => { onToolSelect('polygon'); setShowShapes(false); }}
              >
                <Hexagon className="w-4 h-4" />
                <span>Polygon</span>
              </button>
            </div>
          )}
        </div>

        {/* Connector Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'connector' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Connector Tool"
          onClick={() => onToolSelect('connector')}
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Line Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'line' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Line Tool (L)"
          onClick={() => onToolSelect('line')}
        >
          <Minus className="w-4 h-4" />
        </button>

        {/* Arrow Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'arrow' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Arrow Tool"
          onClick={() => onToolSelect('arrow')}
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-gray-200 dark:bg-gray-700" />

        {/* Pen Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'pen' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Pen Tool (P)"
          onClick={() => onToolSelect('pen')}
        >
          <Pen className="w-4 h-4" />
        </button>

        {/* Text Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'text' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Text Tool (T)"
          onClick={() => onToolSelect('text')}
        >
          <Type className="w-4 h-4" />
        </button>

        <div className="w-6 h-px bg-gray-200 dark:bg-gray-700" />

        {/* Sticky Note Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'sticky' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Sticky Note"
          onClick={() => onToolSelect('sticky')}
        >
          <StickyNote className="w-4 h-4" />
        </button>

        {/* Image Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'image' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Image Upload"
          onClick={() => onToolSelect('image')}
        >
          <Image className="w-4 h-4" />
        </button>

        {/* Comment Tool */}
        <button
          className={`p-2 rounded transition-colors ${activeTool === 'comment' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          title="Comment Tool"
          onClick={() => onToolSelect('comment')}
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}; 