// Shared display helpers for the exercise generators.
//
// Generated statements and worked solutions are read directly by students, so
// interpolated coefficients must never produce "1x", "+ -3", "- -5" or "+ 0".
// These helpers keep the arithmetic in the generators and the typography here.

/** Coefficient in front of a variable: 1 → "x", -1 → "-x", 0 → "", 3 → "3x". */
export function coeff(value: number, variable: string): string {
  if (value === 0) return "";
  if (value === 1) return variable;
  if (value === -1) return `-${variable}`;
  return `${value}${variable}`;
}

/** Continuation term with an explicit operator: 3 → "+ 3", -3 → "- 3", 0 → "". */
export function signedTerm(value: number, variable = ""): string {
  if (value === 0) return "";
  const body = variable ? coeff(Math.abs(value), variable) : String(Math.abs(value));
  return `${value < 0 ? "-" : "+"} ${body}`;
}

/** Parenthesises negatives so substitutions read correctly: -5 → "(-5)", 5 → "5". */
export function paren(value: number): string {
  return value < 0 ? `(${value})` : String(value);
}

/**
 * Joins a leading term with continuation terms, dropping empty ones.
 * polynomial("3x^2", signedTerm(-4, "x"), signedTerm(0)) → "3x^2 - 4x"
 */
export function joinTerms(...terms: string[]): string {
  const kept = terms.filter((term) => term.length > 0);
  return kept.length ? kept.join(" ") : "0";
}
