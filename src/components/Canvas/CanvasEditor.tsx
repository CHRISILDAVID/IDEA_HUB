import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Transformer } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { v4 as uuidv4 } from 'uuid';
import { 
  Square, 
  Circle as CircleIcon, 
  Type, 
  Minus, 
  MousePointer, 
  Trash2,
  Copy,
  RotateCcw,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CanvasObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'line' | 'diamond';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fontSize?: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rotation?: number;
  points?: number[];
}

interface CanvasEditorProps {
  initialObjects?: CanvasObject[];
  readOnly?: boolean;
  onObjectsChange?: (objects: CanvasObject[]) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  initialObjects = [],
  readOnly = false,
  onObjectsChange
}) => {
  const { isAuthenticated } = useAuth();
  const [objects, setObjects] = useState<CanvasObject[]>(initialObjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'text' | 'line' | 'diamond'>('select');
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const canEdit = isAuthenticated && !readOnly;

  useEffect(() => {
    if (onObjectsChange) {
      onObjectsChange(objects);
    }
  }, [objects, onObjectsChange]);

  const checkDeselect = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedId(null);
    }
  }, []);

  const handleObjectSelect = useCallback((id: string) => {
    if (!canEdit) return;
    setSelectedId(id);
  }, [canEdit]);

  const handleObjectChange = useCallback((id: string, newAttrs: Partial<CanvasObject>) => {
    if (!canEdit) return;
    setObjects(prev => prev.map(obj => 
      obj.id === id ? { ...obj, ...newAttrs } : obj
    ));
  }, [canEdit]);

  const addObject = useCallback((newObject: Omit<CanvasObject, 'id'>) => {
    if (!canEdit) return;
    const objectWithId = { ...newObject, id: uuidv4() };
    setObjects(prev => [...prev, objectWithId]);
  }, [canEdit]);

  const deleteSelected = useCallback(() => {
    if (!canEdit || !selectedId) return;
    setObjects(prev => prev.filter(obj => obj.id !== selectedId));
    setSelectedId(null);
  }, [canEdit, selectedId]);

  const duplicateSelected = useCallback(() => {
    if (!canEdit || !selectedId) return;
    const selectedObject = objects.find(obj => obj.id === selectedId);
    if (selectedObject) {
      const duplicate = {
        ...selectedObject,
        id: uuidv4(),
        x: selectedObject.x + 20,
        y: selectedObject.y + 20
      };
      setObjects(prev => [...prev, duplicate]);
    }
  }, [canEdit, selectedId, objects]);

  const handleStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!canEdit || tool === 'select') return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const relativePos = {
      x: (pos.x - stagePos.x) / scale,
      y: (pos.y - stagePos.y) / scale
    };

    setIsDrawing(true);

    const baseObject = {
      x: relativePos.x,
      y: relativePos.y,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      rotation: 0
    };

    switch (tool) {
      case 'rectangle':
        addObject({
          ...baseObject,
          type: 'rectangle',
          width: 100,
          height: 60
        });
        break;
      case 'circle':
        addObject({
          ...baseObject,
          type: 'circle',
          radius: 40
        });
        break;
      case 'text':
        addObject({
          ...baseObject,
          type: 'text',
          text: 'Double click to edit',
          fontSize: 16,
          fill: '#1f2937',
          stroke: 'transparent'
        });
        break;
      case 'line':
        addObject({
          ...baseObject,
          type: 'line',
          points: [0, 0, 100, 0],
          fill: 'transparent'
        });
        break;
    }

    setTool('select');
    setIsDrawing(false);
  }, [canEdit, tool, addObject, scale, stagePos]);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.1;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  const resetView = useCallback(() => {
    setScale(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    const newScale = Math.min(scale * 1.2, 3);
    setScale(newScale);
  }, [scale]);

  const zoomOut = useCallback(() => {
    const newScale = Math.max(scale / 1.2, 0.1);
    setScale(newScale);
  }, [scale]);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedId) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedId]);

  const renderObject = (obj: CanvasObject) => {
    const commonProps = {
      id: obj.id,
      key: obj.id,
      x: obj.x,
      y: obj.y,
      fill: obj.fill,
      stroke: obj.stroke,
      strokeWidth: obj.strokeWidth,
      rotation: obj.rotation || 0,
      draggable: canEdit,
      onClick: () => handleObjectSelect(obj.id),
      onTap: () => handleObjectSelect(obj.id),
      onDragEnd: (e: any) => {
        handleObjectChange(obj.id, {
          x: e.target.x(),
          y: e.target.y()
        });
      },
      onTransformEnd: (e: any) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        
        node.scaleX(1);
        node.scaleY(1);
        
        handleObjectChange(obj.id, {
          x: node.x(),
          y: node.y(),
          width: obj.width ? Math.max(5, node.width() * scaleX) : undefined,
          height: obj.height ? Math.max(5, node.height() * scaleY) : undefined,
          radius: obj.radius ? Math.max(5, obj.radius * Math.max(scaleX, scaleY)) : undefined,
          rotation: node.rotation()
        });
      }
    };

    switch (obj.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={obj.width || 100}
            height={obj.height || 60}
          />
        );
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={obj.radius || 40}
          />
        );
      case 'text':
        return (
          <Text
            {...commonProps}
            text={obj.text || 'Text'}
            fontSize={obj.fontSize || 16}
            onDblClick={() => {
              if (!canEdit) return;
              const newText = prompt('Enter text:', obj.text || '');
              if (newText !== null) {
                handleObjectChange(obj.id, { text: newText });
              }
            }}
          />
        );
      case 'line':
        return (
          <Line
            {...commonProps}
            points={obj.points || [0, 0, 100, 0]}
            lineCap="round"
            lineJoin="round"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Toolbar */}
      {canEdit && (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTool('select')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'select'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Select"
            >
              <MousePointer className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('rectangle')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'rectangle'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Rectangle"
            >
              <Square className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('circle')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'circle'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Circle"
            >
              <CircleIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('text')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'text'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Text"
            >
              <Type className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('line')}
              className={`p-2 rounded-lg transition-colors ${
                tool === 'line'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title="Line"
            >
              <Minus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {selectedId && (
              <>
                <button
                  onClick={duplicateSelected}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-5 h-5" />
                </button>
                <button
                  onClick={deleteSelected}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Canvas Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {!canEdit && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {isAuthenticated ? 'Read-only mode' : 'Sign in to edit'}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <Stage
          ref={stageRef}
          width={window.innerWidth}
          height={window.innerHeight - 120}
          onMouseDown={checkDeselect}
          onTouchStart={checkDeselect}
          onWheel={handleWheel}
          scaleX={scale}
          scaleY={scale}
          x={stagePos.x}
          y={stagePos.y}
          draggable={tool === 'select'}
          onClick={handleStageMouseDown}
        >
          <Layer>
            {/* Grid */}
            {Array.from({ length: 50 }, (_, i) => (
              <Line
                key={`grid-v-${i}`}
                points={[i * 50, 0, i * 50, 2500]}
                stroke="#e5e7eb"
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
            {Array.from({ length: 50 }, (_, i) => (
              <Line
                key={`grid-h-${i}`}
                points={[0, i * 50, 2500, i * 50]}
                stroke="#e5e7eb"
                strokeWidth={0.5}
                opacity={0.3}
              />
            ))}
            
            {/* Objects */}
            {objects.map(renderObject)}
            
            {/* Transformer */}
            {canEdit && <Transformer ref={transformerRef} />}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};