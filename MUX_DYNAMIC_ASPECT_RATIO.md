# Dynamic Aspect Ratio Detection - Guide

## Overview
The Mux Player now **automatically detects** the aspect ratio from video metadata! No manual configuration needed for most videos.

## How It Works

### Automatic Detection (Default)
When a video loads, the player:
1. Listens for the `loadedmetadata` event
2. Reads the video's native `videoWidth` and `videoHeight`
3. Calculates the exact aspect ratio (e.g., `1920 / 1080`)
4. Applies it to the player automatically

**Result:** Every video displays with its correct native aspect ratio, no matter if it's 16:9, 4:3, 1:1, 9:16, or any custom ratio!

## Three Ways to Control Aspect Ratio

### 1. **Automatic Detection** (Recommended - Default Behavior)
The player automatically detects the aspect ratio from the video metadata.

**When to use:**
- ✅ Most use cases
- ✅ When you upload videos with different aspect ratios
- ✅ When you want "set it and forget it" behavior

**In Storyblok:**
- Just add the `mux_playback_id`
- Leave `aspect_ratio` field empty or don't add it
- Player auto-detects!

```tsx
<MuxPlayer
  playbackId="abc123xyz"
  dynamicAspectRatio={true}  // Default - auto-detect
  // aspectRatio prop is ignored when dynamicAspectRatio=true
/>
```

### 2. **Manual Override** (When You Need Control)
Set a specific aspect ratio in Storyblok to override auto-detection.

**When to use:**
- 🎨 Artistic reasons (crop video to specific ratio)
- 📐 Design consistency (force all videos to same ratio)
- 🔧 Special layouts

**In Storyblok:**
- Add the `aspect_ratio` field to your schema
- Set a value like `1 / 1` or `21 / 9`
- Player uses your value instead of auto-detecting

```tsx
<MuxPlayer
  playbackId="abc123xyz"
  aspectRatio="1 / 1"
  dynamicAspectRatio={false}  // Disable auto-detection
/>
```

### 3. **Hybrid Mode** (Smart Fallback)
Auto-detect when not manually set, use manual value when provided.

**This is what ColumnVideo and BlokProjectSlider do:**
```tsx
<MuxPlayer
  playbackId={blok.mux_playback_id}
  aspectRatio={blok.aspect_ratio || '16 / 9'}
  dynamicAspectRatio={!blok.aspect_ratio}  // Auto only if not set
/>
```

**Behavior:**
- If `aspect_ratio` is set in Storyblok → Use that value
- If `aspect_ratio` is empty → Auto-detect from video
- Perfect for mixed content!

## Implementation Details

### Component Logic

```typescript
// State to store detected aspect ratio
const [detectedAspectRatio, setDetectedAspectRatio] = useState<string | null>(null);

// Listen for metadata loaded event
useEffect(() => {
  if (!playerRef.current || !dynamicAspectRatio) return;
  
  const player = playerRef.current;
  
  const handleLoadedMetadata = () => {
    const video = player.media || player.querySelector('video');
    
    if (video && video.videoWidth && video.videoHeight) {
      const calculatedRatio = `${video.videoWidth} / ${video.videoHeight}`;
      setDetectedAspectRatio(calculatedRatio);
    }
  };
  
  player.addEventListener('loadedmetadata', handleLoadedMetadata);
  
  return () => {
    player.removeEventListener('loadedmetadata', handleLoadedMetadata);
  };
}, [dynamicAspectRatio, playbackId]);

// Use detected or provided aspect ratio
const finalAspectRatio = dynamicAspectRatio && detectedAspectRatio 
  ? detectedAspectRatio 
  : aspectRatio;
```

### Priority Order

1. **Dynamic detection** (if `dynamicAspectRatio=true` and metadata loaded)
2. **Manual aspectRatio prop** (if `dynamicAspectRatio=false` or detection failed)
3. **Default fallback** (`16 / 9`)

## Examples

### Example 1: Auto-Detection (Recommended)
```tsx
// In Storyblok: Only set mux_playback_id
// Leave aspect_ratio empty

<MuxPlayer
  playbackId="abc123xyz"
  // dynamicAspectRatio defaults to true
  // Will auto-detect: 1920x1080 → "1920 / 1080" → 16:9
/>
```

### Example 2: Force Square for Social Media
```tsx
// In Storyblok: Set aspect_ratio = "1 / 1"

<MuxPlayer
  playbackId="abc123xyz"
  aspectRatio="1 / 1"
  dynamicAspectRatio={false}
  // Video will be cropped to square, regardless of source
/>
```

### Example 3: Portrait Video (Auto-Detected)
```tsx
// Video is 1080x1920 (portrait)
// Auto-detection will find: "1080 / 1920" → 9:16

<MuxPlayer
  playbackId="abc123xyz"
  dynamicAspectRatio={true}
  // Perfect for TikTok/Stories format!
/>
```

### Example 4: Mixed Content
```tsx
// Some videos have aspect_ratio set, some don't
// The component handles both automatically

{videos.map(video => (
  <MuxPlayer
    key={video.id}
    playbackId={video.mux_playback_id}
    aspectRatio={video.aspect_ratio || '16 / 9'}
    dynamicAspectRatio={!video.aspect_ratio}
  />
))}
```

## Debugging

### Check Detected Aspect Ratio
The component logs the detected dimensions to console:

```
Detected video dimensions: { width: 1920, height: 1080, ratio: "1920 / 1080" }
```

Open browser DevTools → Console to see this info.

### Common Aspect Ratios

| Dimensions | Ratio | Simplified | Common Name |
|------------|-------|------------|-------------|
| 1920×1080 | 1920 / 1080 | 16 / 9 | HD, YouTube |
| 1280×720 | 1280 / 720 | 16 / 9 | HD 720p |
| 3840×2160 | 3840 / 2160 | 16 / 9 | 4K UHD |
| 1080×1080 | 1080 / 1080 | 1 / 1 | Instagram Square |
| 1080×1920 | 1080 / 1920 | 9 / 16 | TikTok, Stories |
| 2560×1080 | 2560 / 1080 | 21 / 9 | Ultrawide |
| 1440×1080 | 1440 / 1080 | 4 / 3 | Classic TV |

### Inspect the Player
```javascript
// In browser console:
const player = document.querySelector('mux-player');
const video = player.media || player.querySelector('video');
console.log('Video dimensions:', {
  width: video.videoWidth,
  height: video.videoHeight,
  ratio: `${video.videoWidth} / ${video.videoHeight}`
});
```

## Migration Path

### Phase 1: Automatic (Current Implementation)
- All videos auto-detect aspect ratio
- No changes needed in Storyblok
- Works immediately!

### Phase 2: Manual Overrides (Optional)
- Add `aspect_ratio` field to Storyblok schema
- Only set it for videos that need manual control
- Most videos continue using auto-detection

### Phase 3: Consistency Check (Optional)
- Review all videos
- Decide: auto-detect or manual control per video
- Update Storyblok accordingly

## Advantages Over Manual Entry

### ✅ Auto-Detection Benefits:
- **No manual data entry** - Aspect ratio comes from the video itself
- **Always accurate** - Based on actual video dimensions
- **Less maintenance** - Upload video, get correct ratio automatically
- **Handles all formats** - Works with any aspect ratio, even unusual ones
- **Faster workflow** - No need to look up or calculate ratios

### ⚠️ Manual Override Benefits:
- **Artistic control** - Crop videos to specific ratios for design
- **Consistency** - Force all videos to same ratio
- **Special cases** - Override when auto-detection isn't desired

## Troubleshooting

### Video appears stretched/squashed
- Check if manual `aspect_ratio` is set incorrectly
- Try removing `aspect_ratio` field to enable auto-detection
- Check console for detected dimensions

### Aspect ratio not updating
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Check that `dynamicAspectRatio={true}` (or not explicitly set to false)
- Verify video metadata is loading (check console logs)

### Want to disable auto-detection
```tsx
<MuxPlayer
  playbackId="abc123xyz"
  aspectRatio="16 / 9"
  dynamicAspectRatio={false}  // Explicitly disable
/>
```

## Performance

**Impact:** Minimal
- Event listener only fires once when metadata loads
- Simple width/height calculation
- No API calls or network requests
- No re-renders after initial detection

## Browser Support

Works in all modern browsers that support:
- ✅ `loadedmetadata` event (all modern browsers)
- ✅ `videoWidth` / `videoHeight` properties (all modern browsers)
- ✅ CSS `aspect-ratio` property (all modern browsers, Safari 15+)

## Summary

**🎉 Best Practice:** Leave aspect ratio detection automatic (default behavior) for most videos. Only set manual aspect ratios when you need specific control for design or artistic reasons.

**Default Behavior:**
```tsx
// This just works! ✨
<MuxPlayer playbackId="abc123xyz" />
// Aspect ratio auto-detected from video metadata
```

**Manual Override When Needed:**
```tsx
// Force square for Instagram
<MuxPlayer 
  playbackId="abc123xyz" 
  aspectRatio="1 / 1"
  dynamicAspectRatio={false}
/>
```

---

**Questions?** Check the `MUX_INTEGRATION_GUIDE.md` for more Mux setup information.

