export type PollingFrequency = "fast" | "moderate" | "slow";

export const DEFAULT_POLLING_FREQUENCY: PollingFrequency = "moderate";

export const POLLING_FREQUENCY_OPTIONS: { value: PollingFrequency; label: string }[] = [
  { value: "fast", label: "Fast" },
  { value: "moderate", label: "Moderate" },
  { value: "slow", label: "Slow" },
];

const POLLING_FREQUENCY_MS: Record<PollingFrequency, number> = {
  fast: 500,
  moderate: 1000,
  slow: 2000,
};

export function pollingFrequencyToMs(frequency: PollingFrequency): number {
  return POLLING_FREQUENCY_MS[frequency];
}
