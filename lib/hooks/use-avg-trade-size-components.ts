"use client";

import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import {
	AVG_TRADE_SIZE_STORAGE_KEY,
	DEFAULT_KPI_VOLUME_COMPONENTS,
	deserializeVolumeComponents,
	type VolumeComponentId,
} from "@/lib/struct/analytics-shared";

export function useAvgTradeSizeComponents() {
	return useLocalStorage<readonly VolumeComponentId[]>(
		AVG_TRADE_SIZE_STORAGE_KEY,
		DEFAULT_KPI_VOLUME_COMPONENTS,
		{ deserialize: deserializeVolumeComponents },
	);
}
