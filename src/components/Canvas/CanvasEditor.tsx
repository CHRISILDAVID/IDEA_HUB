import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Transformer, Arrow } from 'react-konva';
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
import { CanvasTool } from './CanvasToolbar';
import { CanvasTopBar } from './CanvasTopBar';
import { PropertiesPanel } from './PropertiesPanel';

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

interface CanvasEditorProps {
  initialObjects?: CanvasObject[];
  readOnly?: boolean;
  onObjectsChange?: (objects: CanvasObject[]) => void;
  activeTool: CanvasTool;
  onToolSelect?: (tool: CanvasTool) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  initialObjects = [],
  readOnly = false,
  onObjectsChange,
  activeTool,
  onToolSelect
}) => {
  const { isAuthenticated } = useAuth();
  const [objects, setObjects] = useState<CanvasObject[]>(initialObjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<CanvasObject[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [saving, setSaving] = useState(false);
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const canEdit = isAuthenticated && !readOnly;

  // History management
  const saveToHistory = useCallback((newObjects: CanvasObject[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newObjects]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setObjects(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setObjects(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    if (onObjectsChange) {
      onObjectsChange(objects);
    }
    // Save to history when objects change
    if (objects.length > 0) {
      saveToHistory(objects);
    }
  }, [objects, onObjectsChange, saveToHistory]);

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

  const groupSelected = useCallback(() => {
    // TODO: Implement grouping functionality
    console.log('Group selected objects');
  }, []);

  const ungroupSelected = useCallback(() => {
    // TODO: Implement ungrouping functionality
    console.log('Ungroup selected objects');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // TODO: Implement save functionality
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Saving canvas...', objects);
    } catch (error) {
      console.error('Error saving canvas:', error);
    } finally {
      setSaving(false);
    }
  }, [objects]);

  const handleShare = useCallback(() => {
    // TODO: Implement share functionality
    console.log('Sharing canvas...');
  }, []);

  const handleStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!canEdit || activeTool === 'select') return;

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
      rotation: 0,
      opacity: 1
    };

    switch (activeTool) {
      case 'frame':
        addObject({
          ...baseObject,
          type: 'rectangle',
          width: 400,
          height: 300,
          fill: 'transparent',
          stroke: '#6b7280',
          strokeWidth: 1,
          strokeStyle: 'dashed'
        });
        break;
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
      case 'diamond':
        addObject({
          ...baseObject,
          type: 'diamond',
          width: 80,
          height: 80
        });
        break;
      case 'polygon':
        addObject({
          ...baseObject,
          type: 'polygon',
          width: 60,
          height: 60
        });
        break;
      case 'text':
        addObject({
          ...baseObject,
          type: 'text',
          text: 'Double click to edit',
          fontSize: 16,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          textAlign: 'left',
          fill: '#1f2937',
          stroke: 'transparent'
        });
        break;
      case 'connector':
        addObject({
          ...baseObject,
          type: 'connector',
          points: [0, 0, 100, 0],
          fill: 'transparent',
          connectorType: 'straight',
          startArrow: 'none',
          endArrow: 'arrow'
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
      case 'arrow':
        addObject({
          ...baseObject,
          type: 'arrow',
          points: [0, 0, 100, 0],
          fill: 'transparent',
          startArrow: 'none',
          endArrow: 'arrow'
        });
        break;
      case 'sticky':
        addObject({
          ...baseObject,
          type: 'rectangle',
          width: 120,
          height: 80,
          fill: '#fef3c7',
          stroke: '#f59e0b',
          text: 'Sticky Note'
        });
        break;
      case 'image':
        // Handle image upload
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              addObject({
                ...baseObject,
                type: 'rectangle',
                width: 150,
                height: 100,
                fill: `url(${e.target?.result})`,
                stroke: '#6b7280'
              });
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
        break;
      case 'comment':
        addObject({
          ...baseObject,
          type: 'rectangle',
          width: 100,
          height: 60,
          fill: '#dbeafe',
          stroke: '#3b82f6',
          text: 'Comment'
        });
        break;
      case 'pen':
        // For pen tool, we'll need to implement freehand drawing
        // For now, just add a small circle
        addObject({
          ...baseObject,
          type: 'circle',
          radius: 2,
          fill: '#1f2937'
        });
        break;
    }

    setIsDrawing(false);
  }, [canEdit, activeTool, addObject, scale, stagePos]);

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
      opacity: obj.opacity || 1,
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
            cornerRadius={obj.cornerRadius || 0}
            dash={obj.strokeStyle === 'dashed' ? [10, 5] : obj.strokeStyle === 'dotted' ? [2, 2] : undefined}
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
            fontFamily={obj.fontFamily || 'Arial'}
            fontWeight={obj.fontWeight || 'normal'}
            align={obj.textAlign || 'left'}
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
            dash={obj.strokeStyle === 'dashed' ? [10, 5] : obj.strokeStyle === 'dotted' ? [2, 2] : undefined}
          />
        );
      case 'arrow':
        return (
          <Arrow
            {...commonProps}
            points={obj.points || [0, 0, 100, 0]}
            pointerLength={obj.endArrow === 'arrow' ? 10 : 0}
            pointerWidth={obj.endArrow === 'arrow' ? 10 : 0}
            lineCap="round"
            lineJoin="round"
            dash={obj.strokeStyle === 'dashed' ? [10, 5] : obj.strokeStyle === 'dotted' ? [2, 2] : undefined}
          />
        );
      case 'connector':
        return (
          <Arrow
            {...commonProps}
            points={obj.points || [0, 0, 100, 0]}
            pointerLength={obj.endArrow === 'arrow' ? 10 : 0}
            pointerWidth={obj.endArrow === 'arrow' ? 10 : 0}
            lineCap="round"
            lineJoin="round"
            dash={obj.strokeStyle === 'dashed' ? [10, 5] : obj.strokeStyle === 'dotted' ? [2, 2] : undefined}
          />
        );
      default:
        return null;
    }
  };

  const selectedObject = objects.find(obj => obj.id === selectedId) || null;

  return (
    <div className="w-full h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <CanvasTopBar
        scale={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetView={resetView}
        onUndo={undo}
        onRedo={redo}
        onGroup={groupSelected}
        onUngroup={ungroupSelected}
        onCopy={duplicateSelected}
        onDelete={deleteSelected}
        onSave={handleSave}
        onShare={handleShare}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        canGroup={false} // TODO: Implement
        canUngroup={false} // TODO: Implement
        canCopy={!!selectedId}
        canDelete={!!selectedId}
        saving={saving}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex">
        {/* Canvas */}
        <div className="flex-1 relative">
          <Stage
            ref={stageRef}
            width={window.innerWidth - (selectedObject ? 320 : 0)}
            height={window.innerHeight - 120}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            onWheel={handleWheel}
            scaleX={scale}
            scaleY={scale}
            x={stagePos.x}
            y={stagePos.y}
            draggable={activeTool === 'hand'}
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

        {/* Properties Panel */}
        {selectedObject && (
          <PropertiesPanel
            selectedObject={selectedObject}
            onObjectChange={handleObjectChange}
          />
        )}
      </div>
    </div>
  );
};