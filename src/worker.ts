/**
 * LondoBridge - Stremio Addon for Real-Debrid on Cloudflare Workers
 * Routes:
 * - /:key/manifest.json - Returns Stremio manifest
 * - /:key/stream/:type/:id.json - Returns stream data using RD API
 */

interface Env {
  // Environment bindings would go here if needed
}

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Stremio manifest configuration
const MANIFEST = {
  id: 'com.londogard.bridge',
  version: '1.0.0',
  name: 'LondoBridge',
  description: 'Real-Debrid integration for Stremio',
  resources: ['stream'],
  types: ['movie', 'series'],
  catalogs: [],
  idPrefixes: ['tt'],
};

/**
 * Mock function to get magnet hash from IMDb ID
 * In a real implementation, this would query a database or API
 */
function getHash(imdbId: string): string {
  // Mock magnet link - in production this would fetch real data
  return `magnet:?xt=urn:btih:MOCK${imdbId}&dn=Mock+Movie`;
}

/**
 * Fetch stream URL from Real-Debrid API
 */
async function fetchRDStream(apiKey: string, magnetLink: string): Promise<string | null> {
  try {
    // Step 1: Add magnet to RD
    const addMagnetResponse = await fetch('https://api.real-debrid.com/rest/1.0/torrents/addMagnet', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `magnet=${encodeURIComponent(magnetLink)}`,
    });

    if (!addMagnetResponse.ok) {
      console.error('Failed to add magnet:', await addMagnetResponse.text());
      return null;
    }

    const addMagnetData = await addMagnetResponse.json() as { id: string; uri: string };
    const torrentId = addMagnetData.id;

    // Step 2: Get torrent info to select files
    const torrentInfoResponse = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!torrentInfoResponse.ok) {
      console.error('Failed to get torrent info');
      return null;
    }

    const torrentInfo = await torrentInfoResponse.json() as { links: string[] };

    // Step 3: Get the first available link (simplified logic)
    if (!torrentInfo.links || torrentInfo.links.length === 0) {
      console.error('No links available in torrent');
      return null;
    }

    const link = torrentInfo.links[0];

    // Step 4: Unrestrict the link to get direct download URL
    const unrestrictResponse = await fetch('https://api.real-debrid.com/rest/1.0/unrestrict/link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `link=${encodeURIComponent(link)}`,
    });

    if (!unrestrictResponse.ok) {
      console.error('Failed to unrestrict link');
      return null;
    }

    const unrestrictData = await unrestrictResponse.json() as { download: string };
    return unrestrictData.download;
  } catch (error) {
    console.error('Error fetching RD stream:', error);
    return null;
  }
}

/**
 * Handle manifest.json requests
 */
function handleManifest(): Response {
  return new Response(JSON.stringify(MANIFEST, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Handle stream requests
 */
async function handleStream(apiKey: string, type: string, id: string): Promise<Response> {
  // Extract IMDb ID (remove .json extension if present)
  const imdbId = id.replace('.json', '');

  // Get magnet hash (mocked)
  const magnetLink = getHash(imdbId);

  // Fetch stream from Real-Debrid
  const directLink = await fetchRDStream(apiKey, magnetLink);

  if (!directLink) {
    return new Response(JSON.stringify({ streams: [] }), {
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  }

  // Return stream in Stremio format
  const streamResponse = {
    streams: [
      {
        name: 'Londo',
        title: '4K',
        url: directLink,
      },
    ],
  };

  return new Response(JSON.stringify(streamResponse, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

/**
 * Main worker fetch handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle OPTIONS requests for CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: CORS_HEADERS,
      });
    }

    // Parse route: /:key/manifest.json or /:key/stream/:type/:id.json
    const pathParts = path.split('/').filter(Boolean);

    if (pathParts.length < 2) {
      return new Response('Invalid path', {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const apiKey = pathParts[0];

    // Handle manifest route: /:key/manifest.json
    if (pathParts[1] === 'manifest.json') {
      return handleManifest();
    }

    // Handle stream route: /:key/stream/:type/:id.json
    if (pathParts[1] === 'stream' && pathParts.length >= 4) {
      const type = pathParts[2];
      const id = pathParts[3];
      return await handleStream(apiKey, type, id);
    }

    // Unknown route
    return new Response('Not found', {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
};
