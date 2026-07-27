import type { TranslationKey } from "../i18n/i18n";

export type PollingFrequency = "fast" | "moderate" | "slow";

export const DEFAULT_POLLING_FREQUENCY: PollingFrequency = "moderate";

export const POLLING_FREQUENCY_OPTIONS: { value: PollingFrequency; labelKey: TranslationKey }[] = [
  { value: "fast", labelKey: "settings.polling.fast" },
  { value: "moderate", labelKey: "settings.polling.moderate" },
  { value: "slow", labelKey: "settings.polling.slow" },
];

const POLLING_FREQUENCY_MS: Record<PollingFrequency, number> = {
  fast: 500,
  moderate: 1000,
  slow: 2000,
};

export function pollingFrequencyToMs(frequency: PollingFrequency): number {
  return POLLING_FREQUENCY_MS[frequency];
}
