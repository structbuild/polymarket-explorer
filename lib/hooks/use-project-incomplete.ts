"use client";

import { useLocalStorage } from "@/lib/hooks/use-local-storage";

export const PROJECT_INCOMPLETE_STORAGE_KEY = "pmx:project-incomplete";
export const DEFAULT_PROJECT_INCOMPLETE = true;

export const PROJECT_INCOMPLETE_EXPLAINER =
	"Estimate unfinished time buckets from their current pace so open bars are comparable to completed ones. Not reliable for analysis.";

function deserialize(raw: string): boolean {
	const parsed = JSON.parse(raw) as unknown;
	return typeof parsed === "boolean" ? parsed : DEFAULT_PROJECT_INCOMPLETE;
}

export function useProjectIncomplete() {
	const [enabled, setEnabled] = useLocalStorage<boolean>(
		PROJECT_INCOMPLETE_STORAGE_KEY,
		DEFAULT_PROJECT_INCOMPLETE,
		{ deserialize },
	);

	return { enabled, setEnabled } as const;
}
