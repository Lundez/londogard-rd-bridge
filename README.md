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

### Deployment
```bash
npm run deploy
```

## Usage

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
