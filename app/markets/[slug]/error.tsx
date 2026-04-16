"use client";

import { RouteError } from "@/components/seo/route-error";

export default function MarketError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteError
			title="Couldn't load this market"
			description="We weren't able to fetch live data for this prediction market. The Polymarket API may be temporarily unavailable."
			error={error}
			reset={reset}
		/>
	);
}
