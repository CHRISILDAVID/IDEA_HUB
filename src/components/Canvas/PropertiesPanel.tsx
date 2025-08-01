import React, { useState } from 'react';
import {
  Move,
  RotateCw,
  Palette,
  Type,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Eye,
  EyeOff,
  Layers,
  Droplets,
  Sparkles
} from 'lucide-react';

interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'diamond' | 'polygon' | 'connector' | 'arrow';
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

interface PropertiesPanelProps {
  selectedObject: CanvasObject | null;
  onObjectChange: (id: string, changes: Partial<CanvasObject>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedObject,
  onObjectChange
}) => {
  const [activeTab, setActiveTab] = useState<'design' | 'layout' | 'effects'>('design');

  if (!selectedObject) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select an object to edit its properties</p>
        </div>
      </div>
    );
  }

  const handleChange = (field: keyof CanvasObject, value: any) => {
    onObjectChange(selectedObject.id, { [field]: value });
  };

  const renderShapeProperties = () => (
    <>
      {/* Position */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <Move className="w-4 h-4" />
          <span>Position</span>
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">X</label>
            <input
              type="number"
              value={selectedObject.x}
              onChange={(e) => handleChange('x', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Y</label>
            <input
              type="number"
              value={selectedObject.y}
              onChange={(e) => handleChange('y', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      {(selectedObject.width || selectedObject.height) && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Size</h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width</label>
              <input
                type="number"
                value={selectedObject.width || 0}
                onChange={(e) => handleChange('width', parseFloat(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Height</label>
              <input
                type="number"
                value={selectedObject.height || 0}
                onChange={(e) => handleChange('height', parseFloat(e.target.value))}
                className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Radius for circles */}
      {selectedObject.type === 'circle' && selectedObject.radius && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Radius</h3>
          <input
            type="number"
            value={selectedObject.radius}
            onChange={(e) => handleChange('radius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {/* Corner Radius for rectangles */}
      {selectedObject.type === 'rectangle' && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Corner Radius</h3>
          <input
            type="number"
            value={selectedObject.cornerRadius || 0}
            onChange={(e) => handleChange('cornerRadius', parseFloat(e.target.value))}
            className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {/* Rotation */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <RotateCw className="w-4 h-4" />
          <span>Rotation</span>
        </h3>
        <input
          type="number"
          value={selectedObject.rotation || 0}
          onChange={(e) => handleChange('rotation', parseFloat(e.target.value))}
          className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>
    </>
  );

  const renderTextProperties = () => (
    <>
      {/* Text Content */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <Type className="w-4 h-4" />
          <span>Text</span>
        </h3>
        <textarea
          value={selectedObject.text || ''}
          onChange={(e) => handleChange('text', e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          rows={3}
        />
      </div>

      {/* Font Properties */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Font</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Family</label>
            <select
              value={selectedObject.fontFamily || 'Arial'}
              onChange={(e) => handleChange('fontFamily', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
              <option value="Courier New">Courier New</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Size</label>
            <input
              type="number"
              value={selectedObject.fontSize || 16}
              onChange={(e) => handleChange('fontSize', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Weight</label>
            <select
              value={selectedObject.fontWeight || 'normal'}
              onChange={(e) => handleChange('fontWeight', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="100">Thin</option>
              <option value="300">Light</option>
              <option value="500">Medium</option>
              <option value="700">Bold</option>
              <option value="900">Black</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Alignment</label>
            <div className="flex space-x-1">
              {(['left', 'center', 'right'] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => handleChange('textAlign', align)}
                  className={`flex-1 py-1 px-2 text-xs rounded ${
                    selectedObject.textAlign === align
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {align.charAt(0).toUpperCase() + align.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderConnectorProperties = () => (
    <>
      {/* Connector Type */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</h3>
        <select
          value={selectedObject.connectorType || 'straight'}
          onChange={(e) => handleChange('connectorType', e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="straight">Straight</option>
          <option value="elbow">Elbow</option>
          <option value="curved">Curved</option>
        </select>
      </div>

      {/* Arrowheads */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Arrowheads</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start</label>
            <select
              value={selectedObject.startArrow || 'none'}
              onChange={(e) => handleChange('startArrow', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="none">None</option>
              <option value="arrow">Arrow</option>
              <option value="triangle">Triangle</option>
              <option value="circle">Circle</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End</label>
            <select
              value={selectedObject.endArrow || 'none'}
              onChange={(e) => handleChange('endArrow', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="none">None</option>
              <option value="arrow">Arrow</option>
              <option value="triangle">Triangle</option>
              <option value="circle">Circle</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );

  const renderDesignProperties = () => (
    <>
      {/* Fill Color */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <Palette className="w-4 h-4" />
          <span>Fill</span>
        </h3>
        <div className="flex items-center space-x-2">
          <input
            type="color"
            value={selectedObject.fill}
            onChange={(e) => handleChange('fill', e.target.value)}
            className="w-8 h-8 border border-gray-200 dark:border-gray-600 rounded cursor-pointer"
          />
          <input
            type="text"
            value={selectedObject.fill}
            onChange={(e) => handleChange('fill', e.target.value)}
            className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Stroke */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Stroke</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={selectedObject.stroke}
              onChange={(e) => handleChange('stroke', e.target.value)}
              className="w-8 h-8 border border-gray-200 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={selectedObject.stroke}
              onChange={(e) => handleChange('stroke', e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Width</label>
            <input
              type="number"
              value={selectedObject.strokeWidth}
              onChange={(e) => handleChange('strokeWidth', parseFloat(e.target.value))}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Style</label>
            <select
              value={selectedObject.strokeStyle || 'solid'}
              onChange={(e) => handleChange('strokeStyle', e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opacity */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <Eye className="w-4 h-4" />
          <span>Opacity</span>
        </h3>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={selectedObject.opacity || 1}
          onChange={(e) => handleChange('opacity', parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {Math.round((selectedObject.opacity || 1) * 100)}%
        </div>
      </div>
    </>
  );

  const renderEffectsProperties = () => (
    <>
      {/* Drop Shadow */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
          <Sparkles className="w-4 h-4" />
          <span>Drop Shadow</span>
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedObject.effects?.dropShadow?.enabled || false}
              onChange={(e) => handleChange('effects', {
                ...selectedObject.effects,
                dropShadow: {
                  ...selectedObject.effects?.dropShadow,
                  enabled: e.target.checked
                }
              })}
              className="rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Enable</span>
          </div>
          {selectedObject.effects?.dropShadow?.enabled && (
            <div className="space-y-2 pl-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">X Offset</label>
                <input
                  type="number"
                  value={selectedObject.effects?.dropShadow?.x || 0}
                  onChange={(e) => handleChange('effects', {
                    ...selectedObject.effects,
                    dropShadow: {
                      ...selectedObject.effects?.dropShadow,
                      x: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Y Offset</label>
                <input
                  type="number"
                  value={selectedObject.effects?.dropShadow?.y || 0}
                  onChange={(e) => handleChange('effects', {
                    ...selectedObject.effects,
                    dropShadow: {
                      ...selectedObject.effects?.dropShadow,
                      y: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Blur</label>
                <input
                  type="number"
                  value={selectedObject.effects?.dropShadow?.blur || 0}
                  onChange={(e) => handleChange('effects', {
                    ...selectedObject.effects,
                    dropShadow: {
                      ...selectedObject.effects?.dropShadow,
                      blur: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Color</label>
                <input
                  type="color"
                  value={selectedObject.effects?.dropShadow?.color || '#000000'}
                  onChange={(e) => handleChange('effects', {
                    ...selectedObject.effects,
                    dropShadow: {
                      ...selectedObject.effects?.dropShadow,
                      color: e.target.value
                    }
                  })}
                  className="w-full h-8 border border-gray-200 dark:border-gray-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Properties</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
          {selectedObject.type} • {selectedObject.id.slice(0, 8)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['design', 'layout', 'effects'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'design' && (
          <>
            {renderDesignProperties()}
            {selectedObject.type === 'text' && renderTextProperties()}
            {['connector', 'line', 'arrow'].includes(selectedObject.type) && renderConnectorProperties()}
          </>
        )}
        
        {activeTab === 'layout' && (
          <>
            {renderShapeProperties()}
            {selectedObject.type === 'text' && renderTextProperties()}
            {['connector', 'line', 'arrow'].includes(selectedObject.type) && renderConnectorProperties()}
          </>
        )}
        
        {activeTab === 'effects' && renderEffectsProperties()}
      </div>
    </div>
  );
}; 