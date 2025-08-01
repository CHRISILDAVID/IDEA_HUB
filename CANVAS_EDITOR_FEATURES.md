# Enhanced Canvas Editor Features

## Overview

The enhanced canvas editor is a versatile vector design, diagramming, and whiteboarding tool similar to Figma or Miro. It provides a comprehensive set of tools for creating professional diagrams, flowcharts, wireframes, and visual designs.

## Main Components

### 1. Enhanced Toolbar (`CanvasToolbar.tsx`)

A floating vertical toolbar positioned on the left side of the canvas with the following tools:

#### Core Tools
- **Select/Move Tool (V)**: Default tool for selecting, moving, and resizing objects
- **Frame Tool (F)**: Create artboards or containers for designs
- **Hand/Pan Tool (H)**: Pan around the infinite canvas (also activated by spacebar)

#### Shape Tools (Dropdown)
- **Rectangle (R)**: Create rectangular shapes with customizable corner radius
- **Ellipse (O)**: Create circular and elliptical shapes
- **Diamond**: Create diamond/rhombus shapes
- **Polygon**: Create polygonal shapes

#### Drawing Tools
- **Pen Tool (P)**: Create custom vector paths with Bezier curves
- **Line Tool (L)**: Draw straight lines
- **Arrow Tool**: Create arrows with customizable arrowheads
- **Connector Tool**: Smart connector lines for flowcharts and diagrams

#### Content Tools
- **Text Tool (T)**: Add and edit text elements with rich formatting
- **Sticky Note Tool**: Add comments or notes directly on canvas
- **Image Upload**: Import and place images

### 2. Enhanced Top Bar (`CanvasTopBar.tsx`)

A comprehensive top bar with multiple control sections:

#### Zoom Controls (Left)
- Zoom In/Out buttons
- Current zoom level display
- Reset View button

#### History Controls (Center)
- Undo (Ctrl+Z) and Redo (Ctrl+Y) buttons
- Visual indication of available history states

#### Object Controls (Right)
- Group/Ungroup objects (Ctrl+G / Ctrl+Shift+G)
- Copy and Delete selected objects
- Save and Share functionality

### 3. Properties Panel (`PropertiesPanel.tsx`)

A contextual panel that appears on the right when an object is selected. Content changes based on object type with three tabs:

#### Design Tab
- **Fill Color**: Color picker and hex input
- **Stroke**: Color, width, and style (solid/dashed/dotted)
- **Opacity**: Slider control with percentage display
- **Text Properties** (for text objects):
  - Font family, size, weight
  - Text alignment (left/center/right)
  - Text content editing

#### Layout Tab
- **Position**: X and Y coordinates
- **Size**: Width and height (for applicable objects)
- **Radius**: For circular objects
- **Corner Radius**: For rectangular objects
- **Rotation**: Angle control

#### Effects Tab
- **Drop Shadow**: Enable/disable with customizable:
  - X and Y offset
  - Blur radius
  - Shadow color

## Object Types and Properties

### Shapes (Rectangle, Circle, Diamond, Polygon)
- Position and dimensions
- Fill and stroke colors
- Stroke width and style
- Corner radius (rectangles)
- Rotation
- Opacity
- Effects (drop shadow)

### Text Objects
- Text content (editable via double-click)
- Font family, size, and weight
- Text alignment
- Fill color
- Position and rotation
- Opacity

### Lines and Connectors
- Stroke color, width, and style
- Start and end arrowhead styles
- Connector type (straight/elbow/curved)
- Position and rotation

### Frames
- Transparent fill with dashed border
- Large default size (400x300)
- Used for organizing content

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| V | Select/Move tool |
| F | Frame tool |
| H | Hand/Pan tool |
| R | Rectangle tool |
| O | Ellipse tool |
| P | Pen tool |
| T | Text tool |
| L | Line tool |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+G | Group objects |
| Ctrl+Shift+G | Ungroup objects |
| Delete | Delete selected object |
| Spacebar | Temporarily activate pan tool |

## Advanced Features

### History Management
- Automatic state tracking for undo/redo
- Visual indication of available history
- Efficient memory management

### Object Selection
- Click to select individual objects
- Transformer handles for resizing and rotating
- Multi-selection support (planned)

### Canvas Navigation
- Mouse wheel zoom
- Pan with hand tool or spacebar
- Reset view to fit content

### Real-time Updates
- Live property updates
- Immediate visual feedback
- Object change callbacks

## Technical Implementation

### Dependencies
- **React Konva**: Canvas rendering and interaction
- **Lucide React**: Icon library
- **UUID**: Unique ID generation
- **Tailwind CSS**: Styling

### State Management
- Local state for objects, selection, and history
- Callback-based updates for parent components
- Optimized re-rendering

### Performance Features
- Efficient object rendering
- Minimal re-renders
- Optimized history management

## Usage Examples

### Creating a Flowchart
1. Use Frame tool to create a container
2. Add rectangles for process steps
3. Use connector tool to link steps
4. Add text labels
5. Customize colors and styles

### Creating a Wireframe
1. Use Frame tool for screen boundaries
2. Add rectangles for UI elements
3. Use text tool for labels
4. Add lines for dividers
5. Group related elements

### Creating a Diagram
1. Use shapes for main elements
2. Add connectors with arrows
3. Include text labels
4. Apply consistent styling
5. Use effects for emphasis

## Future Enhancements

### Planned Features
- Multi-selection and grouping
- Layer management
- Export to SVG/PNG
- Collaboration features
- Templates and presets
- Advanced path editing
- Gradient fills
- More shape types

### Technical Improvements
- Performance optimizations
- Better mobile support
- Accessibility enhancements
- Plugin system
- Custom tool creation

## Integration

The canvas editor is designed to integrate seamlessly with the existing IDEA_HUB application:

- Used in `IdeaDetailPage` for viewing ideas
- Available in edit mode for idea creation
- Supports read-only and editable modes
- Maintains data consistency with the backend

## File Structure

```
src/components/Canvas/
├── CanvasEditor.tsx          # Main canvas component
├── CanvasToolbar.tsx         # Tool selection toolbar
├── CanvasTopBar.tsx          # Top control bar
├── PropertiesPanel.tsx       # Object properties panel
├── DocumentEditor.tsx        # Text document editor
├── DocumentToolbar.tsx       # Document controls
└── ViewToggle.tsx           # View mode switcher
```

This enhanced canvas editor provides a professional-grade vector design and diagramming experience, making it suitable for a wide range of use cases from simple sketches to complex technical diagrams. 