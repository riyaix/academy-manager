/**
 * Pure helper — business rules stay out of React components.
 * Shared entity logic belongs in `src/domain/` instead.
 */
export function formatGreeting(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Hello!";
  }
  return `Hello, ${trimmed}!`;
}
