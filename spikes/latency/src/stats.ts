// spikes/latency/src/stats.ts
/** Nearest-rank percentile: the smallest value ≥ p% of the sorted data. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) throw new Error("percentile of empty array");
  if (p <= 0 || p > 100) throw new Error(`percentile p out of range: ${p}`);
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.ceil((p / 100) * sorted.length) - 1];
}
