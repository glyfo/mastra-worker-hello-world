import app from "./app";

// For Cloudflare Workers:
export default app.fetch;

// If you’re not on Workers (e.g., Bun/Node adapter), remove the line above
// and export `app` as your server instance instead.
