/** A slow illustrative breath, independent of any patient's respiratory rate. */
export function breathingFrame(time: number) {
  const t = ((time % 6) + 6) % 6;
  if (t < 2.5) {
    const progress = t / 2.5;
    return {
      phase: "inhale" as const,
      progress,
      volume: (1 - Math.cos(Math.PI * progress)) / 2,
    };
  }
  if (t < 5.7) {
    const progress = (t - 2.5) / 3.2;
    return {
      phase: "exhale" as const,
      progress,
      volume: (1 + Math.cos(Math.PI * progress)) / 2,
    };
  }
  return { phase: "rest" as const, progress: (t - 5.7) / 0.3, volume: 0 };
}
export type BreathingFrame = ReturnType<typeof breathingFrame>;
