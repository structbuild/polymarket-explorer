export const COMBO_RESOLUTIONS = ["60", "240", "D"] as const;

export type ComboResolution = (typeof COMBO_RESOLUTIONS)[number];

export const DEFAULT_COMBO_RESOLUTION: ComboResolution = "60";

export const COMBO_RESOLUTION_LABELS: Record<ComboResolution, string> = {
	"60": "1H",
	"240": "4H",
	D: "1D",
};

export const COMBO_RESOLUTION_DESCRIPTIONS: Record<ComboResolution, string> = {
	"60": "Hourly candles",
	"240": "4-hour candles",
	D: "Daily candles",
};

export function normalizeComboResolution(value: string | string[] | undefined): ComboResolution {
	const raw = Array.isArray(value) ? value[0] : value;
	return COMBO_RESOLUTIONS.includes(raw as ComboResolution)
		? (raw as ComboResolution)
		: DEFAULT_COMBO_RESOLUTION;
}
