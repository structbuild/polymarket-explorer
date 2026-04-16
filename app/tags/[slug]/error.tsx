"use client";

import { RouteError } from "@/components/seo/route-error";

export default function TagError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteError
			title="Couldn't load markets for this tag"
			description="We weren't able to fetch markets in this category. The Polymarket API may be temporarily unavailable."
			error={error}
			reset={reset}
		/>
	);
}
