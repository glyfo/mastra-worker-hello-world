/**
 * Tiny logger — swap with a real logger later (Workers console is fine).
 */
export function trace(msg: string, data?: unknown) {
	// eslint-disable-next-line no-console
	console.log('[App]', msg, data);
}
