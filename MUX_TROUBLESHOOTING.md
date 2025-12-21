# Mux Video Troubleshooting Guide

## Error: "The URL or playback-id was invalid"

If you're seeing this error, here are the most common causes and solutions:

---

## 1. Using Asset ID Instead of Playback ID ⚠️ **MOST COMMON**

### The Problem
You might be using a **Mux Asset ID** instead of a **Playback ID**.

**Asset ID** (what you might have):
```
J4GyHv7GVzW5Dde011ihG00KX02GvPrXQZJz8IDvdCFm5w
```
This is used for managing the asset via API.

**Playback ID** (what you need):
```
abc123xyz456def789
```
This is shorter and used for playing the video.

### How to Get Your Playback ID

#### Option A: From Mux Dashboard (Easiest)
1. Go to https://dashboard.mux.com
2. Navigate to **Video** → **Assets**
3. Click on your video asset
4. Look for the **"Playback IDs"** section
5. Copy the Playback ID (NOT the Asset ID at the top)

#### Option B: From Mux API
```bash
# Using curl to get asset details
curl https://api.mux.com/video/v1/assets/YOUR_ASSET_ID \
  -H "Authorization: Basic $(echo -n 'MUX_ACCESS_TOKEN_ID:MUX_SECRET_KEY' | base64)"
```

Look for the `playback_ids` array in the response:
```json
{
  "data": {
    "id": "J4GyHv7GVzW5Dde011ihG00KX02GvPrXQZJz8IDvdCFm5w",
    "playback_ids": [
      {
        "id": "abc123xyz456def789",  ← THIS is what you need!
        "policy": "public"
      }
    ]
  }
}
```

---

## 2. Asset Has "Signed" Playback Policy 🔒

### The Problem
If your asset's playback policy is set to "signed", it requires a signed token.

### Check Your Playback Policy
In Mux Dashboard:
1. Go to your asset
2. Check the **Playback Policy** under Playback IDs
3. If it says "signed", you need to generate signed URLs

### Solution A: Change to Public Policy (Recommended for most cases)
1. In Mux Dashboard, go to your asset
2. Under Playback IDs, change the policy to **"public"**
3. Use the playback ID normally

### Solution B: Use Signed URLs (For secure content)
If you need signed playback, you'll need to:
1. Create a signing key in Mux
2. Generate a signed playback token server-side
3. Pass the token to the player

Example with signed URLs:
```tsx
<MuxPlayer
  playbackId="your-playback-id"
  tokens={{
    playback: "your-signed-token"
  }}
/>
```

---

## 3. Asset Not Ready for Playback ⏳

### The Problem
The video might still be processing.

### Solution
1. Go to Mux Dashboard
2. Check your asset's **Status**
3. Wait until status is **"ready"**
4. Processing can take a few minutes depending on video length

---

## 4. Environment Variables Not Set Correctly

### The Problem
Your Mux credentials might not be configured correctly.

### Solution
Check your `.env.local` file:

```bash
# These are for API access (server-side only)
MUX_ACCESS_TOKEN_ID=your_token_id_here
MUX_SECRET_KEY=your_secret_key_here
```

**Important**: 
- These variables are ONLY needed for uploading/managing videos via API
- They are NOT needed for playback in the frontend
- The MuxPlayer component only needs the playback ID (no credentials)

---

## 5. Quick Test: Use Mux's Sample Video

To verify your setup works, try this sample playback ID:

```tsx
<MuxPlayer
  playbackId="EcHgOK9coz5K4rjSwOkoE7Y7O01201YMIC200RI6lNxnhs"
  autoPlay
  muted
  loop
/>
```

This is Mux's official test video. If this works, your setup is correct and the issue is with your specific playback ID.

---

## Complete Checklist

- [ ] I'm using a **Playback ID** (short ID), not an Asset ID (long ID)
- [ ] The playback ID is from the Mux Dashboard under "Playback IDs"
- [ ] The asset status is "ready" in Mux Dashboard
- [ ] The playback policy is "public" (or I'm using signed tokens if "signed")
- [ ] I tested with Mux's sample playback ID and it works
- [ ] My `.env.local` has the correct credentials (if using API features)

---

## Still Having Issues?

### Debug Mode
Add this to see what's being passed to the player:

```tsx
console.log('Playback ID being used:', blok.mux_playback_id);

<MuxPlayer
  playbackId={blok.mux_playback_id}
  onError={(error) => {
    console.error('Mux Player Error:', error);
  }}
  // ... other props
/>
```

### Common Mistakes
1. ❌ Using Asset ID instead of Playback ID
2. ❌ Including spaces or newlines in the playback ID
3. ❌ Trying to use signed content without a token
4. ❌ Asset still processing
5. ❌ Typo in the playback ID

### Get More Info About Your Asset
Run this in your terminal:

```bash
curl https://api.mux.com/video/v1/assets/YOUR_ASSET_ID \
  -u "YOUR_MUX_ACCESS_TOKEN_ID:YOUR_MUX_SECRET_KEY"
```

This will show you all the details including playback IDs.

---

## Advanced: Programmatic Access

If you need to programmatically fetch playback IDs from asset IDs, you can install the Mux Node SDK:

```bash
pnpm add @mux/mux-node
```

Then create server-side utilities to interact with the Mux API. This is only needed for advanced use cases where you're managing videos programmatically.

