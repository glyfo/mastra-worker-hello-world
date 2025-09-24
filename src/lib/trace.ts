// Tiny logger you can swap later
export function trace(msg: string, data?: unknown) {
  console.info("[App]", msg, data);
}
