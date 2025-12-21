# Dynamic Aspect Ratio Setup Guide

## Overview
The Mux Player now supports dynamic aspect ratios from Storyblok CMS. You can set different aspect ratios for each video.

## Storyblok Setup

### For ColumnVideo Component

Add a new field to your ColumnVideo schema:

**Field Details:**
- **Field name**: `aspect_ratio`
- **Field type**: Text (or Options - see below for preset options)
- **Display name**: Aspect Ratio
- **Default value**: `16 / 9`
- **Description**: Video aspect ratio (e.g., 16/9, 4/3, 1/1, 21/9)

### For BlokProjectSlider Component

Add a new field to each project item in your slider:

**Field Details:**
- **Field name**: `aspect_ratio`
- **Field type**: Text (or Options)
- **Display name**: Aspect Ratio
- **Default value**: `16 / 9`
- **Description**: Video aspect ratio

## Recommended Option: Use "Options" Field Type

Instead of text, you can use the **Options** field type with predefined values:

### Common Aspect Ratios:

| Name | Value | Use Case |
|------|-------|----------|
| Standard HD (16:9) | `16 / 9` | Most videos, YouTube standard |
| Widescreen Cinema (21:9) | `21 / 9` | Cinematic videos |
| Classic TV (4:3) | `4 / 3` | Older format, vintage content |
| Square (1:1) | `1 / 1` | Instagram-style, social media |
| Portrait (9:16) | `9 / 16` | Mobile vertical video, TikTok |
| Ultrawide (32:9) | `32 / 9` | Super wide cinematic |
| Academy (11:8) | `11 / 8` | Classic film format |
| Anamorphic (2.39:1) | `2.39 / 1` | Widescreen cinema |

**Setup in Storyblok Options field:**
```
16 / 9    (Standard HD - 16:9)
21 / 9    (Widescreen Cinema - 21:9)
4 / 3     (Classic TV - 4:3)
1 / 1     (Square - 1:1)
9 / 16    (Portrait - 9:16)
2.39 / 1  (Anamorphic Cinema)
```

## Format Requirements

### ✅ Correct Formats:
- `16 / 9` (spaces around slash - RECOMMENDED)
- `16/9` (no spaces)
- `4 / 3`
- `1 / 1`
- `2.39 / 1` (decimal values work too)

### ❌ Incorrect Formats:
- `16:9` (colon not supported in CSS)
- `16-9` (hyphen not supported)
- `16x9` (not a valid CSS value)

## How It Works

### In ColumnVideo:
```typescript
<MuxPlayer
  playbackId={blok.mux_playback_id}
  aspectRatio={blok.aspect_ratio || '16 / 9'}  // Uses custom or defaults to 16:9
  // ... other props
/>
```

### In BlokProjectSlider:
```typescript
<MuxPlayer
  playbackId={currentItem.mux_playback_id}
  aspectRatio={currentItem.aspect_ratio || '16 / 9'}  // Per-item aspect ratio
  // ... other props
/>
```

## Visual Examples

### 16:9 (Standard - Default)
```
┌─────────────────────────────────┐
│                                 │
│          Video Content          │
│                                 │
└─────────────────────────────────┘
```
**Best for**: Most web videos, YouTube, standard content

### 1:1 (Square)
```
┌──────────────────┐
│                  │
│  Video Content   │
│                  │
└──────────────────┘
```
**Best for**: Instagram posts, social media, profile videos

### 9:16 (Portrait)
```
┌──────────┐
│          │
│          │
│  Video   │
│ Content  │
│          │
│          │
└──────────┘
```
**Best for**: Mobile-first content, TikTok, Instagram Stories

### 21:9 (Ultrawide)
```
┌─────────────────────────────────────────┐
│        Cinematic Video Content          │
└─────────────────────────────────────────┘
```
**Best for**: Cinematic content, dramatic presentations

## Testing Different Aspect Ratios

1. Go to your Storyblok entry
2. Add or edit a ColumnVideo component
3. Set the `mux_playback_id` field with your Mux playback ID
4. Set the `aspect_ratio` field (e.g., `1 / 1` for square)
5. Save and preview

## Default Behavior

If you don't set `aspect_ratio` in Storyblok:
- **Default value**: `16 / 9`
- The component will automatically use the standard HD aspect ratio
- No breaking changes to existing content

## Migration Path

1. **Phase 1**: Add the `aspect_ratio` field to Storyblok (optional field)
2. **Phase 2**: Existing videos continue working with default 16:9
3. **Phase 3**: Gradually add aspect ratios to videos as needed
4. **No downtime**: Fully backward compatible

## Advanced: Custom Aspect Ratios

You can use any valid CSS aspect-ratio value:

```
2 / 1       (2:1 - Very wide)
3 / 2       (3:2 - Classic 35mm film)
5 / 4       (5:4 - Vintage computer monitors)
16 / 10     (16:10 - Widescreen computers)
```

## Troubleshooting

### Video appears stretched or squashed
- Check that the aspect ratio format is correct (use `/` not `:`)
- Ensure there are spaces around the slash: `16 / 9`
- Verify the aspect ratio matches your actual video

### Aspect ratio not applying
- Hard refresh your browser (Cmd+Shift+R or Ctrl+Shift+R)
- Check that the field name is exactly `aspect_ratio` (lowercase, underscore)
- Verify the value is being passed to the component in browser DevTools

### Black bars appear
- This means the aspect ratio doesn't match the video's natural ratio
- Either adjust the aspect ratio or use `object-fit: cover` (already applied)

## Best Practices

1. **Match the source**: Use the aspect ratio that matches your original video
2. **Be consistent**: Use the same aspect ratio for similar content types
3. **Mobile consideration**: Test portrait and landscape orientations
4. **Accessibility**: Ensure captions and controls remain visible at all ratios

---

**Need help?** Check the `MUX_INTEGRATION_GUIDE.md` for more information about the Mux integration.

