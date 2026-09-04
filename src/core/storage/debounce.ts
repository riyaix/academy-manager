const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function debounceByKey(key: string, delayMs: number, fn: () => void): void {
  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      fn();
    }, delayMs),
  );
}
