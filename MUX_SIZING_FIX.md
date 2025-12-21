# Mux Player Sizing Fix - Summary

## Problem
The Mux Player was showing with a black background and the video was very small in the center, not taking full width despite setting `width: 100%`.

## Root Cause
The `mux-player` web component has internal default styling that can override inline styles. The component uses Shadow DOM, which requires special CSS targeting to properly control video sizing.

## Solutions Applied

### 1. Updated Global Styles (`src/assets/styles/global.sass`)

#### Added mux-player to column styles (line ~331):
```sass
&-Image, &-Thumbnail, &-Video, &-Slider
  padding: 0 var(--spacing-side)
  padding-bottom: var(--spacing-base)
  flex: 1
  img, video, mux-player
    width: 100%
    height: auto
```

#### Updated ProjectSlider styles (line ~503):
```sass
&-Image
  position: relative
  width: 100%
  aspect-ratio: 16 / 9
  overflow: hidden
  img, video, mux-player
    position: absolute
    top: 0
    left: 0
    width: 100%
    height: 100% !important
    object-fit: cover
```

#### Added dedicated Mux Player styles (line ~182):
```sass
mux-player, .muxPlayer
  display: block !important
  width: 100% !important
  height: auto !important
  aspect-ratio: auto !important
  
  video
    width: 100% !important
    height: 100% !important
    object-fit: cover !important
  
  img
    width: 100% !important
    height: 100% !important
    object-fit: cover !important
```

### 2. Created Dedicated Mux Player CSS (`src/assets/styles/mux-player.css`)

This file contains comprehensive styles to override Mux Player's default behavior:
- Ensures full width for the web component
- Targets Shadow DOM elements via `::part()` pseudo-selectors
- Forces `object-fit: cover` for proper video scaling
- Removes default aspect ratio constraints
- Ensures poster images also fill properly

### 3. Updated MuxPlayer Component (`src/components/MuxPlayer.tsx`)

#### Added CSS import:
```typescript
import '@/assets/styles/mux-player.css';
```

#### Enhanced inline styles:
```typescript
style={{ 
  width: '100%', 
  height: 'auto',
  aspectRatio: 'auto',
  display: 'block',
  ...style 
}}
```

#### Added `streamType` prop:
```typescript
streamType="on-demand"
```

### 4. ColumnVideo Component Already Has className
The `ColumnVideo.tsx` already passes `className="muxPlayer"` to ensure our custom styles are applied.

## Why This Works

1. **Multiple Layers of Control**: By styling at multiple levels (global, component-specific, and inline), we ensure the styles take precedence.

2. **Shadow DOM Targeting**: The `::part()` pseudo-selector and direct element targeting (like `mux-player video`) penetrate the Shadow DOM.

3. **!important Flags**: Used strategically to override the web component's internal defaults.

4. **object-fit: cover**: Ensures the video fills the container proportionally, similar to how background images with `cover` work.

5. **Aspect Ratio Control**: Setting `aspectRatio: 'auto'` prevents the player from forcing a 16:9 ratio and instead respects the container's dimensions.

## Testing Checklist

- [ ] ColumnVideo displays Mux videos at full width
- [ ] BlokProjectSlider displays Mux videos at full width with proper aspect ratio
- [ ] Poster images display at full width before video loads
- [ ] Videos maintain proper aspect ratio (no stretching or squashing)
- [ ] No black bars or backgrounds around the video
- [ ] Works on desktop and mobile viewports
- [ ] Works in both portrait and landscape orientations

## Common Issues & Solutions

### Issue: Video still shows small
**Solution**: Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to clear cached styles.

### Issue: Black background persists
**Solution**: Check that the CSS file is being imported and that the `muxPlayer` className is applied to the component.

### Issue: Wrong aspect ratio
**Solution**: For ColumnVideo, it should be auto-height. For BlokProjectSlider, it's fixed at 16:9 (or 3:2 on portrait). Check that you're in the right context.

## Browser DevTools Debugging

To debug Mux Player sizing issues:

1. Right-click on the video → Inspect
2. Look for the `<mux-player>` element
3. Check computed styles - width should be 100%
4. Expand the Shadow DOM (if visible)
5. Check the internal `<video>` element styles
6. Verify `object-fit` is set to `cover`

## Files Modified

- ✅ `src/assets/styles/global.sass` - Updated multiple selectors
- ✅ `src/assets/styles/mux-player.css` - New file created
- ✅ `src/components/MuxPlayer.tsx` - Added CSS import and enhanced styles
- ✅ `src/components/storyblok/ColumnVideo.tsx` - Already had className
- ✅ `src/components/storyblok/BlokProjectSlider.tsx` - Ready to use

No other changes needed!

