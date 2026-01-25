const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/index.js',
    banner: {
        js: '#!/Users/mihirmaru/.nvm/versions/node/v20.19.4/bin/node',
    },
    external: [], // Bundle everything!
}).catch(() => process.exit(1));
