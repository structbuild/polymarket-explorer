"use client";

import { useVolumeMode } from "@/lib/hooks/use-volume-mode";

export function VolumeModeLabel({
	usd,
	notional,
}: {
	usd: string;
	notional: string;
}) {
	const { mode } = useVolumeMode();
	return <>{mode === "notional" ? notional : usd}</>;
}
