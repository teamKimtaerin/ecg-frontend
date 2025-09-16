# Virtual Timeline Video Controller

## Overview

The Virtual Timeline Video Controller provides an intuitive interface for controlling video playback based on **virtual timeline coordinates** rather than real video time. This addresses the critical UX need identified: after cut editing operations (split, delete, move), users should interact with the edited timeline, not the original video timeline.

## Key Concept

**Real Video Time vs Virtual Timeline Time:**

- **Real Video Time**: Original video timeline (0 to original duration)
- **Virtual Timeline Time**: Edited timeline after cuts (0 to edited duration)
- **User Interaction**: All controls operate on virtual timeline coordinates

## Architecture

### Components

```
VirtualTimelineVideoController/
├── index.tsx                          # Main controller component
├── VirtualTimelineProgressBar.tsx     # Virtual timeline progress/scrubber
├── VirtualSegmentVisualization.tsx    # Detailed segment timeline view
├── VirtualTimeControls.tsx           # Advanced time navigation controls
└── README.md                         # This documentation
```

### Integration Points

1. **Virtual Timeline System**: `/src/utils/virtual-timeline/`
2. **RVFC Engine**: Frame-precise video synchronization
3. **ECG Store**: Zustand state management integration
4. **UI Components**: Existing ECG design system components

## Components Detail

### 1. VirtualTimelineVideoController (Main)

**Purpose**: Primary interface combining all virtual timeline controls

**Features**:

- Virtual timeline play/pause controls
- Volume control with slider overlay
- Playback rate selection (0.25x - 2x)
- Keyboard shortcuts (Space, Arrow keys, Home/End, M for mute)
- Virtual time display with real-time formatting
- Integration with all sub-components

**Props**:

```typescript
interface VirtualTimelineVideoControllerProps {
  className?: string
  onVirtualTimeUpdate?: (virtualTime: number, duration: number) => void
  showSegmentVisualization?: boolean
  showVolumeControls?: boolean
}
```

### 2. VirtualTimelineProgressBar

**Purpose**: Interactive progress bar operating on virtual timeline coordinates

**Features**:

- Click-to-seek based on virtual time positions
- Visual representation of timeline segments with color coding:
  - Blue: Normal segments
  - Green: Split segments
  - Purple: Moved segments
  - Red (striped): Deleted segments (gaps)
- Hover preview with time tooltip and segment info
- Drag scrubbing with visual feedback
- Current position indicator with enhanced styling during interaction

**Visual Elements**:

- Segment borders showing cut edit operations
- Gaps indicating deleted content
- Hover time indicator line
- Current segment information display

### 3. VirtualSegmentVisualization

**Purpose**: Detailed visual timeline showing all cut edit operations

**Features**:

- Comprehensive segment display with tooltips
- Color-coded segment types with legend
- Click navigation to segment start times
- Deleted segment visualization with strikethrough effect
- Segment numbering and type indicators
- Current time marker with precise positioning

**Interaction**:

- Click segments to seek to their start time
- Hover for detailed segment information
- Visual distinction between active and deleted segments

### 4. VirtualTimeControls

**Purpose**: Advanced time navigation and input controls

**Features**:

- Frame-by-frame navigation (±1 frame assuming 30fps)
- Configurable jump distances (1s, 5s, 10s, 30s, 60s)
- Direct time input with format parsing (supports "mm:ss" and "h:mm:ss")
- Skip to start/end shortcuts
- Clickable time display for direct editing
- Keyboard navigation support

**Time Input Features**:

- Auto-formatting time display
- Click-to-edit time input field
- Enter to confirm, Escape to cancel
- Validation and error handling

## User Experience

### Virtual Timeline Benefits

1. **Intuitive Interaction**: Users see and control the edited timeline they're working with
2. **Visual Clarity**: Cut operations are clearly represented visually
3. **Precise Control**: Frame-accurate seeking and navigation
4. **Consistent UX**: All controls operate on the same virtual coordinate system

### Keyboard Shortcuts

- **Space**: Play/Pause virtual timeline
- **←/→**: Jump backward/forward (configurable distance)
- **Home/End**: Jump to timeline start/end
- **M**: Toggle mute
- **Frame keys**: ±1 frame navigation (when advanced controls enabled)

### Visual Design

- **Dark Theme**: Consistent with ECG editor interface
- **Color Coding**: Intuitive segment type identification
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Implementation Status

### ✅ Completed Components

1. **VirtualTimelineVideoController**: Main interface with all controls
2. **VirtualTimelineProgressBar**: Interactive virtual timeline scrubber
3. **VirtualSegmentVisualization**: Detailed segment timeline view
4. **VirtualTimeControls**: Advanced navigation controls
5. **Icon Integration**: All required Lucide icons added to ECG system
6. **TypeScript**: Full type safety and compilation success

### ⚠️ Current Limitations

1. **Store Integration**: Using mock data pending virtual timeline store implementation
2. **RVFC Connection**: Needs integration with actual VirtualPlayerController
3. **Real Video Sync**: Requires connection to HTML5 video element

### 🔄 Integration Requirements

To fully activate the Virtual Timeline Video Controller:

1. **Implement Virtual Timeline Store Slice**:

   ```typescript
   // Add to EditorStore
   virtualTimeline: VirtualTimeline
   virtualPlayerController: VirtualPlayerController
   playVirtualTimeline: () => Promise<void>
   pauseVirtualTimeline: () => void
   seekVirtualTimeline: (time: number) => void
   ```

2. **Connect RVFC Engine**: Link VirtualPlayerController to HTML5 video
3. **Replace Mock Data**: Remove temporary mock data with real virtual timeline state

## Usage Example

```tsx
import { VirtualTimelineVideoController } from './components/VirtualTimelineVideoController'

function EditorPage() {
  const handleVirtualTimeUpdate = (virtualTime: number, duration: number) => {
    console.log(`Virtual time: ${virtualTime}s / ${duration}s`)
  }

  return (
    <div className="editor-layout">
      {/* Video display area */}
      <VideoPlayer />

      {/* Virtual Timeline Controls */}
      <VirtualTimelineVideoController
        onVirtualTimeUpdate={handleVirtualTimeUpdate}
        showSegmentVisualization={true}
        showVolumeControls={true}
        className="mt-4"
      />
    </div>
  )
}
```

## Technical Details

### Dependencies

- **React 19**: Latest React features and patterns
- **Zustand**: State management integration
- **Lucide React**: Icon system
- **ECG UI Components**: Button, Slider, Tooltip, etc.
- **Virtual Timeline Types**: Custom type definitions

### Performance Considerations

- **RVFC Synchronization**: Frame-precise timing without performance impact
- **Event Throttling**: Optimized drag and hover interactions
- **Memory Management**: Proper cleanup of event listeners and timers

### Browser Compatibility

- **Modern Browsers**: Supports all browsers with RVFC API
- **Fallback Handling**: Graceful degradation for older browsers
- **Mobile Support**: Touch-friendly interaction design

## Future Enhancements

1. **Waveform Integration**: Audio waveform visualization in timeline
2. **Zoom Controls**: Timeline zoom for precise editing
3. **Marker System**: User-defined timeline markers
4. **Export Integration**: Timeline metadata for video export
5. **Undo/Redo**: Visual timeline operation history

## Conclusion

The Virtual Timeline Video Controller successfully addresses the core UX insight: users need to interact with virtual timeline coordinates representing their edited content, not the original video timeline. This implementation provides a comprehensive, accessible, and visually clear interface for virtual timeline control while maintaining consistency with the ECG design system.

The architecture is designed for seamless integration with the existing Virtual Timeline system and provides a solid foundation for advanced video editing workflows in the ECG editor.
