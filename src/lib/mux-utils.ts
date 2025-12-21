/**
 * Mux API Utilities
 * 
 * Helper functions for working with Mux Video API
 * These run server-side only to keep your credentials secure
 */

import Mux from '@mux/mux-node';

// Initialize Mux client (server-side only)
const muxClient = new Mux({
  tokenId: process.env.MUX_ACCESS_TOKEN_ID!,
  tokenSecret: process.env.MUX_SECRET_KEY!,
});

/**
 * Get playback ID from a Mux Asset ID
 * 
 * @param assetId - The Mux asset ID (e.g., "J4GyHv7GVzW5Dde011ihG00KX02GvPrXQZJz8IDvdCFm5w")
 * @returns The playback ID to use in the MuxPlayer component
 */
export async function getPlaybackIdFromAsset(assetId: string): Promise<string | null> {
  try {
    const asset = await muxClient.video.assets.retrieve(assetId);
    
    // Assets can have multiple playback IDs, get the first one
    const playbackId = asset.playback_ids?.[0]?.id;
    
    if (!playbackId) {
      console.error('No playback ID found for asset:', assetId);
      return null;
    }
    
    return playbackId;
  } catch (error) {
    console.error('Error fetching playback ID:', error);
    return null;
  }
}

/**
 * Get asset details including playback IDs
 * 
 * @param assetId - The Mux asset ID
 * @returns Asset details including all playback IDs
 */
export async function getAssetDetails(assetId: string) {
  try {
    const asset = await muxClient.video.assets.retrieve(assetId);
    
    return {
      id: asset.id,
      status: asset.status,
      playback_ids: asset.playback_ids,
      duration: asset.duration,
      aspect_ratio: asset.aspect_ratio,
      created_at: asset.created_at,
    };
  } catch (error) {
    console.error('Error fetching asset details:', error);
    return null;
  }
}

/**
 * Create a signed playback URL (if your asset requires signed URLs)
 * 
 * @param playbackId - The playback ID
 * @param signingKeyId - Your Mux signing key ID
 * @param signingKeySecret - Your Mux signing key secret
 * @returns Signed playback token
 */
export function createSignedPlaybackToken(
  playbackId: string,
  signingKeyId: string,
  signingKeySecret: string
): string {
  const jwt = require('jsonwebtoken');
  
  const token = jwt.sign(
    {
      sub: playbackId,
      aud: 'v',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    },
    Buffer.from(signingKeySecret, 'base64'),
    { algorithm: 'RS256', keyid: signingKeyId }
  );
  
  return token;
}

export default muxClient;

