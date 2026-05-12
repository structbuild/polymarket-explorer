"use client";

import { useCallback } from "react";

import { useLocalStorage } from "@/lib/hooks/use-local-storage";

export const VOLUME_MODES = ["usd", "notional"] as const;
export type VolumeMode = (typeof VOLUME_MODES)[number];

export const VOLUME_MODE_STORAGE_KEY = "pmx:volume-mode";
export const DEFAULT_VOLUME_MODE: VolumeMode = "usd";

export const VOLUME_MODE_LABELS: Record<VolumeMode, string> = {
	usd: "USD",
	notional: "Notional",
};

export const VOLUME_MODE_EXPLAINER = {
	heading: "Volume display",
	usd: "Actual dollars exchanged (price × shares).",
	notional: "Total $1-payout shares traded — what Polymarket displays as “Volume”.",
	footnote: "The two diverge because each share resolves to between $0.00 and $1.00.",
} as const;

function isVolumeMode(value: unknown): value is VolumeMode {
	return value === "usd" || value === "notional";
}

function deserialize(raw: string): VolumeMode {
	const parsed = JSON.parse(raw) as unknown;
	return isVolumeMode(parsed) ? parsed : DEFAULT_VOLUME_MODE;
}

export function useVolumeMode() {
	const [mode, setMode] = useLocalStorage<VolumeMode>(VOLUME_MODE_STORAGE_KEY, DEFAULT_VOLUME_MODE, {
		deserialize,
	});

	const toggle = useCallback(() => {
		setMode((current) => (current === "usd" ? "notional" : "usd"));
	}, [setMode]);

	return { mode, setMode, toggle } as const;
}
