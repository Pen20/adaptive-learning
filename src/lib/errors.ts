/**
 * Narrows a caught value (typed `unknown` since TypeScript 4.4) to a message
 * string, so handlers do not have to fall back to `any`.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}
