import React, { forwardRef, useCallback, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Arrow } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { WorkspaceElement, WorkspaceAppState } from './EraserWorkspace';

interface WorkspaceCanvasProps {
  elements: WorkspaceElement[];
  appState: WorkspaceAppState;
  selectedElementIds: string[];
  onElementsChange: (elements: WorkspaceElement[]) => void;
  onAppStateChange: (updates: Partial<WorkspaceAppState>) => void;
  onSelectionChange: (ids: string[]) => void;
  onAddElement: (element: Omit<WorkspaceElement, 'id'>) => void;
  onUpdateElement: (id: string, updates: Partial<WorkspaceElement>) => void;
  readOnly?: boolean;
}

export const WorkspaceCanvas = forwardRef<any, WorkspaceCanvasProps>(({
  elements,
  appState,
  selectedElementIds,
  onElementsChange,
  onAppStateChange,
  onSelectionChange,
  onAddElement,
  onUpdateElement,
  readOnly = false,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = React.useState({ width: 800, height: 600 });
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [currentPath, setCurrentPath] = React.useState<number[]>([]);

  // Update stage size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (readOnly) return;

    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      onSelectionChange([]);
      return;
    }

    const clickedId = e.target.id();
    if (clickedId) {
      onSelectionChange([clickedId]);
    }
  }, [onSelectionChange, readOnly]);

  const handleStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (readOnly || appState.activeTool.type === 'selection') return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const snapToGrid = appState.snapToGrid;
    const gridSize = appState.gridSize;
    
    const snappedPos = snapToGrid ? {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize,
    } : pos;

    if (appState.activeTool.type === 'pen') {
      setIsDrawing(true);
      setCurrentPath([snappedPos.x, snappedPos.y]);
      return;
    }

    const baseElement = {
      x: snappedPos.x,
      y: snappedPos.y,
      fill: appState.currentItemBackgroundColor,
      stroke: appState.currentItemStrokeColor,
      strokeWidth: appState.currentItemStrokeWidth,
      rotation: 0,
      opacity: appState.currentItemOpacity / 100,
    };

    switch (appState.activeTool.type) {
      case 'rectangle':
        onAddElement({
          ...baseElement,
          type: 'rectangle',
          width: 100,
          height: 60,
        });
        break;
      case 'circle':
        onAddElement({
          ...baseElement,
          type: 'circle',
          radius: 40,
        });
        break;
      case 'arrow':
        onAddElement({
          ...baseElement,
          type: 'arrow',
          points: [0, 0, 100, 0],
          startArrowhead: appState.currentItemStartArrowhead,
          endArrowhead: appState.currentItemEndArrowhead,
        });
        break;
      case 'text':
        onAddElement({
          ...baseElement,
          type: 'text',
          text: 'Double click to edit',
          fontSize: appState.currentItemFontSize,
          fontFamily: appState.currentItemFontFamily,
          fill: appState.currentItemStrokeColor,
          stroke: 'transparent',
        });
        break;
    }
  }, [appState, onAddElement, readOnly]);

  const handleStageMouseMove = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || appState.activeTool.type !== 'pen') return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();
    if (!point) return;

    const snapToGrid = appState.snapToGrid;
    const gridSize = appState.gridSize;
    
    const snappedPoint = snapToGrid ? {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    } : point;

    setCurrentPath(prev => [...prev, snappedPoint.x, snappedPoint.y]);
  }, [isDrawing, appState.activeTool.type, appState.snapToGrid, appState.gridSize]);

  const handleStageMouseUp = useCallback(() => {
    if (isDrawing && appState.activeTool.type === 'pen' && currentPath.length > 2) {
      onAddElement({
        type: 'pen',
        x: 0,
        y: 0,
        points: currentPath,
        fill: 'transparent',
        stroke: appState.currentItemStrokeColor,
        strokeWidth: appState.currentItemStrokeWidth,
        opacity: appState.currentItemOpacity / 100,
      });
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, appState, currentPath, onAddElement]);

  const renderElement = (element: WorkspaceElement) => {
    const isSelected = selectedElementIds.includes(element.id);
    const commonProps = {
      id: element.id,
      key: element.id,
      x: element.x,
      y: element.y,
      fill: element.fill,
      stroke: element.stroke,
      strokeWidth: element.strokeWidth,
      rotation: element.rotation || 0,
      opacity: element.opacity,
      draggable: !readOnly,
      onClick: () => !readOnly && onSelectionChange([element.id]),
      onTap: () => !readOnly && onSelectionChange([element.id]),
      onDragEnd: (e: any) => {
        if (readOnly) return;
        onUpdateElement(element.id, {
          x: e.target.x(),
          y: e.target.y(),
        });
      },
    };

    switch (element.type) {
      case 'rectangle':
        return (
          <Rect
            {...commonProps}
            width={element.width || 100}
            height={element.height || 60}
          />
        );
      case 'circle':
        return (
          <Circle
            {...commonProps}
            radius={element.radius || 40}
          />
        );
      case 'text':
        return (
          <Text
            {...commonProps}
            text={element.text || 'Text'}
            fontSize={element.fontSize || 20}
            fontFamily={element.fontFamily || 'Arial'}
            onDblClick={() => {
              if (readOnly) return;
              const newText = prompt('Enter text:', element.text || '');
              if (newText !== null) {
                onUpdateElement(element.id, { text: newText });
              }
            }}
          />
        );
      case 'arrow':
        return (
          <Arrow
            {...commonProps}
            points={element.points || [0, 0, 100, 0]}
            pointerLength={10}
            pointerWidth={10}
          />
        );
      case 'pen':
        return (
          <Line
            {...commonProps}
            points={element.points || []}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      default:
        return null;
    }
  };

  const renderGrid = () => {
    if (!appState.showGrid) return null;

    const gridLines = [];
    const gridSize = appState.gridSize;
    
    // Vertical lines
    for (let i = 0; i < stageSize.width; i += gridSize) {
      gridLines.push(
        <Line
          key={`grid-v-${i}`}
          points={[i, 0, i, stageSize.height]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.3}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i < stageSize.height; i += gridSize) {
      gridLines.push(
        <Line
          key={`grid-h-${i}`}
          points={[0, i, stageSize.width, i]}
          stroke="#e5e7eb"
          strokeWidth={0.5}
          opacity={0.3}
        />
      );
    }
    
    return gridLines;
  };

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden">
      <Stage
        ref={ref}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={appState.zoom.value}
        scaleY={appState.zoom.value}
        x={appState.scrollX}
        y={appState.scrollY}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        style={{ backgroundColor: appState.viewBackgroundColor }}
      >
        <Layer>
          {/* Grid */}
          {renderGrid()}
          
          {/* Elements */}
          {elements.map(renderElement)}
          
          {/* Current drawing path */}
          {isDrawing && currentPath.length > 2 && (
            <Line
              points={currentPath}
              stroke={appState.currentItemStrokeColor}
              strokeWidth={appState.currentItemStrokeWidth}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              opacity={appState.currentItemOpacity / 100}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});