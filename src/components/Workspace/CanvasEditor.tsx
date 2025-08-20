import React, { useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Circle, Text, Line, Transformer } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { v4 as uuidv4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  addCanvasObject, 
  updateCanvasObject, 
  deleteCanvasObject, 
  setSelectedObjectId 
} from '../../store/slices/ideaSlice';
import { setActiveEditor } from '../../store/slices/workspaceSlice';
import { executeCommand } from '../../store/slices/historySlice';

export const CanvasEditor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { activeTool, activeEditor } = useAppSelector(state => state.workspace);
  const { canvasObjects, selectedObjectId } = useAppSelector(state => state.idea);
  
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [stageSize, setStageSize] = React.useState({ width: 800, height: 600 });

  // Update stage size on window resize
  useEffect(() => {
    const updateSize = () => {
      const container = stageRef.current?.container();
      if (container) {
        setStageSize({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && selectedObjectId) {
      const stage = stageRef.current;
      const selectedNode = stage.findOne(`#${selectedObjectId}`);
      if (selectedNode) {
        transformerRef.current.nodes([selectedNode]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedObjectId]);

  const handleStageClick = useCallback((e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (clickedOnEmpty) {
      dispatch(setSelectedObjectId(null));
      return;
    }

    // Focus canvas when clicked
    dispatch(setActiveEditor('canvas'));
  }, [dispatch]);

  const handleStageMouseDown = useCallback((e: KonvaEventObject<MouseEvent>) => {
    if (activeTool === 'select') return;

    const pos = e.target.getStage()?.getPointerPosition();
    if (!pos) return;

    const baseObject = {
      id: uuidv4(),
      x: pos.x,
      y: pos.y,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      rotation: 0,
      opacity: 1,
    };

    let newObject;

    switch (activeTool) {
      case 'rectangle':
        newObject = {
          ...baseObject,
          type: 'rectangle' as const,
          width: 100,
          height: 60,
        };
        break;
      case 'circle':
        newObject = {
          ...baseObject,
          type: 'circle' as const,
          radius: 40,
        };
        break;
      case 'text':
        newObject = {
          ...baseObject,
          type: 'text' as const,
          text: 'Double click to edit',
          fontSize: 16,
          fontFamily: 'Arial',
          fill: '#1f2937',
          stroke: 'transparent',
        };
        break;
      default:
        return;
    }

    // Create command for undo/redo
    const addCommand = {
      id: uuidv4(),
      type: 'addCanvasObject',
      execute: () => dispatch(addCanvasObject(newObject)),
      undo: () => dispatch(deleteCanvasObject(newObject.id)),
      description: `Add ${newObject.type}`,
      timestamp: Date.now(),
    };

    dispatch(executeCommand(addCommand));
  }, [activeTool, dispatch]);

  const handleObjectSelect = useCallback((id: string) => {
    dispatch(setSelectedObjectId(id));
    dispatch(setActiveEditor('canvas'));
  }, [dispatch]);

  const handleObjectChange = useCallback((id: string, newAttrs: any) => {
    const oldObject = canvasObjects.find(obj => obj.id === id);
    if (!oldObject) return;

    const updateCommand = {
      id: uuidv4(),
      type: 'updateCanvasObject',
      execute: () => dispatch(updateCanvasObject({ id, changes: newAttrs })),
      undo: () => dispatch(updateCanvasObject({ id, changes: oldObject })),
      description: `Update ${oldObject.type}`,
      timestamp: Date.now(),
    };

    dispatch(executeCommand(updateCommand));
  }, [canvasObjects, dispatch]);

  const renderObject = (obj: any) => {
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
      draggable: true,
      onClick: () => handleObjectSelect(obj.id),
      onTap: () => handleObjectSelect(obj.id),
      onDragEnd: (e: any) => {
        handleObjectChange(obj.id, {
          x: e.target.x(),
          y: e.target.y(),
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
          rotation: node.rotation(),
        });
      },
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
            fontFamily={obj.fontFamily || 'Arial'}
            onDblClick={() => {
              const newText = prompt('Enter text:', obj.text || '');
              if (newText !== null) {
                handleObjectChange(obj.id, { text: newText });
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div 
      className={`flex-1 relative overflow-hidden ${
        activeEditor === 'canvas' ? 'ring-2 ring-blue-500 ring-inset' : ''
      }`}
      onClick={() => dispatch(setActiveEditor('canvas'))}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        onClick={handleStageClick}
        onMouseDown={handleStageMouseDown}
      >
        <Layer>
          {/* Grid */}
          {Array.from({ length: Math.ceil(stageSize.width / 50) }, (_, i) => (
            <Line
              key={`grid-v-${i}`}
              points={[i * 50, 0, i * 50, stageSize.height]}
              stroke="#e5e7eb"
              strokeWidth={0.5}
              opacity={0.3}
            />
          ))}
          {Array.from({ length: Math.ceil(stageSize.height / 50) }, (_, i) => (
            <Line
              key={`grid-h-${i}`}
              points={[0, i * 50, stageSize.width, i * 50]}
              stroke="#e5e7eb"
              strokeWidth={0.5}
              opacity={0.3}
            />
          ))}
          
          {/* Objects */}
          {canvasObjects.map(renderObject)}
          
          {/* Transformer */}
          <Transformer ref={transformerRef} />
        </Layer>
      </Stage>
    </div>
  );
};