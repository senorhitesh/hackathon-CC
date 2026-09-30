/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exclude CometChat browser-only SDKs from server-side bundling
  serverExternalPackages: [
    '@cometchat/chat-sdk-javascript',
    '@cometchat/calls-sdk-javascript',
  ],
  // Turbopack config (Next 16 default)
  turbopack: {
    // Map the Calls SDK CSS import to an empty stub so Turbopack doesn't
    // try to process it with PostCSS (the SDK auto-imports it from index.es.js)
    resolveAlias: {
      '@cometchat/calls-sdk-javascript/dist/index.css': {
        browser: './app/cometchat-calls-stub.css',
        default: './app/cometchat-calls-stub.css',
      },
    },
  },
};

export default nextConfig;
