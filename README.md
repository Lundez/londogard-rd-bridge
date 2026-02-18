# londogard-rd-bridge
LondoBridge - Stremio Addon for Real-Debrid on Cloudflare Workers

## Overview
A Stremio addon that integrates Real-Debrid for streaming movies and series. Built for Cloudflare Workers using TypeScript.

## Features
- **Manifest Route**: `/:key/manifest.json` - Returns Stremio manifest configuration
- **Stream Route**: `/:key/stream/:type/:id.json` - Returns stream URLs from Real-Debrid
- CORS support for cross-origin requests
- Native fetch API (no Node.js dependencies)

## Setup

### Prerequisites
- Node.js and npm
- Cloudflare account (for deployment)
- Real-Debrid API key

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Local Health Check
With the worker running, verify both manifest and stream routes:

```bash
npm run check:local -- YOUR_RD_API_KEY tt0133093
```

Optional environment variables:
- `BASE_URL` (default: `http://localhost:8787`)
- `RD_API_KEY` (alternative to CLI arg)
- `IMDB_ID` (default: `tt0133093`)
- `TIMEOUT_MS` (default: `10000`)

### Deployment
```bash
npm run deploy
```

## Usage

### Test with Stremio (Local)
1. Start local worker:
	```bash
	npm run dev
	```
2. Verify manifest quickly:
	```bash
	curl http://localhost:8787/YOUR_RD_API_KEY/manifest.json
	```
3. Add addon in Stremio using:
	```
	http://localhost:8787/YOUR_RD_API_KEY/manifest.json
	```

If Stremio keeps loading forever on manifest:
- Ensure `npm run dev` is actively running in a terminal
- Run `npm run check:local -- YOUR_RD_API_KEY` to validate endpoint responses
- If local networking is blocked, deploy and use the `workers.dev` manifest URL instead

### Manifest Endpoint
```
GET /:apikey/manifest.json
```
Returns the Stremio addon manifest with:
- ID: `com.londogard.bridge`
- Name: `LondoBridge`
- Supported types: `movie`, `series`

### Stream Endpoint
```
GET /:apikey/stream/:type/:id.json
```
- `:apikey` - Your Real-Debrid API key
- `:type` - Content type (`movie` or `series`)
- `:id` - IMDb ID (e.g., `tt1234567`)

Returns stream data in Stremio format with direct download links from Real-Debrid.

## Architecture
- Uses Cloudflare Workers for serverless execution
- Native fetch API for HTTP requests
- TypeScript for type safety
- Mock `getHash()` function (to be replaced with real implementation)

## License
MIT
