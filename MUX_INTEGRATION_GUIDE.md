# Mux Video Integration Guide

## Overview
Your project now uses Mux Video streaming platform for video playback. This guide explains how to use the new `MuxPlayer` component and update your Storyblok content.

## What's Been Implemented

### 1. MuxPlayer Component (`src/components/MuxPlayer.tsx`)
A reusable, fully-typed Mux video player component with all your existing features:
- ✅ Autoplay support
- ✅ Loop support with optional pause delays between loops
- ✅ Muted playback
- ✅ Poster images
- ✅ Preloading
- ✅ Mobile-friendly (playsInline)
- ✅ Customizable styling and colors

### 2. Updated Components
- **ColumnVideo**: Now supports both Mux playback IDs and legacy direct video URLs
- **BlokProjectSlider**: Now supports both Mux playback IDs and legacy direct video URLs

Both components maintain backward compatibility with your existing video URLs while supporting the new Mux streaming.

## How to Use in Storyblok

### For ColumnVideo Component

Add a new field in your Storyblok schema:
- **Field name**: `mux_playback_id`
- **Field type**: Text
- **Description**: The Mux playback ID for streaming video

**Migration Path:**
1. Keep your existing `link` field (direct video URL) for now
2. Add the new `mux_playback_id` field
3. When you upload videos to Mux, paste the playback ID into this field
4. The component will automatically use Mux if `mux_playback_id` is present, otherwise fall back to the direct URL

### For BlokProjectSlider Component

In each project item, add:
- **Field name**: `mux_playback_id`
- **Field type**: Text
- **Description**: The Mux playback ID for streaming video

**Migration Path:**
1. Keep your existing `video_link` field for now
2. Add the new `mux_playback_id` field
3. When you upload videos to Mux, paste the playback ID into this field
4. The component will prioritize Mux playback ID, then fall back to direct video URL, then images

## Getting Your Mux Playback ID

After uploading a video to Mux:

1. Go to your Mux dashboard
2. Find your video asset
3. Copy the **Playback ID** (looks like: `abc123xyz456...`)
4. Paste it into the `mux_playback_id` field in Storyblok

**Note**: You do NOT need to include the full Mux URL, just the playback ID.

## Environment Variables

Make sure your `.env.local` file has your Mux credentials:

```bash
MUX_TOKEN_ID=your_token_id
MUX_TOKEN_SECRET=your_token_secret
```

## MuxPlayer Props Reference

The `MuxPlayer` component accepts these props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `playbackId` | string | *required* | The Mux playback ID |
| `poster` | string | undefined | URL for poster/thumbnail image |
| `loop` | boolean | false | Whether to loop the video |
| `muted` | boolean | true | Whether to mute audio |
| `autoPlay` | boolean | false | Whether to autoplay |
| `playsInline` | boolean | true | Play inline on mobile (recommended) |
| `pause` | number | undefined | Seconds to pause between loops |
| `preload` | string | 'auto' | Preload strategy: 'auto', 'metadata', or 'none' |
| `accentColor` | string | undefined | Customize player accent color |
| `primaryColor` | string | undefined | Customize player primary color |
| `secondaryColor` | string | undefined | Customize player secondary color |
| `style` | object | {} | Inline CSS styles |
| `className` | string | undefined | CSS class name |

## Custom Features

### Pause Between Loops
The `pause` prop is a custom feature that adds a delay between video loops:

```tsx
<MuxPlayer
  playbackId="abc123xyz"
  loop={true}
  pause={3} // 3 second delay between loops
/>
```

This is useful for creating breathing room in looping content.

## Styling

The Mux Player can be customized with CSS or inline styles:

```tsx
<MuxPlayer
  playbackId="abc123xyz"
  accentColor="#ff0000"
  primaryColor="#000000"
  secondaryColor="#ffffff"
  style={{ borderRadius: '8px' }}
/>
```

## Testing

1. **Local Testing**: Run `pnpm dev` and test with both Mux playback IDs and legacy video URLs
2. **Production**: Deploy and test on your staging environment before going live

## Troubleshooting

### Video doesn't play
- Check that the playback ID is correct (no spaces, full ID)
- Verify your Mux environment variables are set
- Check browser console for errors
- Ensure the Mux asset is ready (not still processing)

### Fallback to legacy video
- If `mux_playback_id` is empty, the component will use the old `link` or `video_link` field
- This allows gradual migration to Mux

### Autoplay not working
- Autoplay requires `muted={true}` in most browsers
- Ensure `playsInline={true}` for mobile devices

## Benefits of Mux

- 📊 Better analytics and quality of service metrics
- 🚀 Adaptive bitrate streaming (better performance)
- 🎨 Consistent player experience across browsers
- 📱 Optimized delivery for mobile devices
- 💰 Cost-effective video delivery at scale
- 🔒 Secure video delivery with signed URLs (if needed)

## Next Steps

1. Upload your first video to Mux
2. Get the playback ID
3. Add it to a Storyblok entry
4. Test the playback
5. Gradually migrate your existing videos to Mux

---

**Need Help?** Check the official Mux documentation:
- [Mux Video Documentation](https://www.mux.com/docs)
- [Mux Player React](https://github.com/muxinc/elements/tree/main/packages/mux-player-react)

