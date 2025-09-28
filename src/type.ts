// src/types.ts

/**
 * Cloudflare Workers environment bindings available via `c.env`
 */
export type Bindings = {
	AI: unknown;
	CLOUDFLARE_ACCOUNT_ID: string;
	CLOUDFLARE_GATEWAY_ID: string;
	CLOUDFLARE_API_TOKEN: string;
	// Add optional vars as needed:
	// LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
};

/**
 * Per-request variables stored on Hono's Context via c.set()/c.get()
 */
export type Variables = {
	traceId: string; // set in a middleware (crypto.randomUUID())
	// userId?: string;       // example: add more context vars over time
};

/**
 * App context type parameter for Hono
 */
export type AppCtx = {
	Bindings: Bindings;
	Variables: Variables;
};

/**
 * Optional convenience aliases for handlers/middleware
 */
export type C = import('hono').Context<AppCtx>;
export type Handler = import('hono').MiddlewareHandler<AppCtx>;
