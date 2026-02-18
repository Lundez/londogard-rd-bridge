const baseUrl = process.env.BASE_URL || 'http://localhost:8787';
const apiKey = process.env.RD_API_KEY || process.argv[2] || 'testkey';
const imdbId = process.env.IMDB_ID || process.argv[3] || 'tt0133093';
const timeoutMs = Number(process.env.TIMEOUT_MS || 10000);

const endpoints = [
    {
        name: 'manifest',
        url: `${baseUrl}/${apiKey}/manifest.json`,
        validate: (json) => {
            if (!json || typeof json !== 'object') {
                throw new Error('Manifest is not valid JSON object');
            }
            if (!json.id || !json.name || !Array.isArray(json.resources)) {
                throw new Error('Manifest missing required fields (id/name/resources)');
            }
        },
    },
    {
        name: 'stream',
        url: `${baseUrl}/${apiKey}/stream/movie/${imdbId}.json`,
        validate: (json) => {
            if (!json || typeof json !== 'object' || !Array.isArray(json.streams)) {
                throw new Error('Stream response must include streams[]');
            }
        },
    },
];

async function fetchJsonWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        });

        const text = await response.text();
        let parsed;

        try {
            parsed = text ? JSON.parse(text) : null;
        } catch {
            throw new Error(`Invalid JSON response: ${text.slice(0, 300)}`);
        }

        return { response, parsed };
    } finally {
        clearTimeout(timer);
    }
}

async function run() {
    console.log(`Checking local addon at ${baseUrl}`);
    console.log(`Using apiKey=${apiKey.slice(0, 4)}*** imdbId=${imdbId}`);

    let hasFailure = false;

    for (const endpoint of endpoints) {
        try {
            const { response, parsed } = await fetchJsonWithTimeout(endpoint.url, timeoutMs);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${JSON.stringify(parsed).slice(0, 300)}`);
            }

            endpoint.validate(parsed);
            console.log(`✓ ${endpoint.name}: ${endpoint.url}`);
        } catch (error) {
            hasFailure = true;
            console.error(`✗ ${endpoint.name}: ${endpoint.url}`);
            console.error(`  ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    if (hasFailure) {
        process.exitCode = 1;
        return;
    }

    console.log('All local checks passed.');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});