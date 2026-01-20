import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        host: '0.0.0.0',
        // Allow Kavia preview hostnames (including vscode-internal.* used by embedded previews)
        allowedHosts: ['.kavia.ai', '.vscode-internal.kavia.ai'],
        port: 3000,
        strictPort: true,
        cors: true,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        watch: {
            usePolling: true
        }
    }
})
