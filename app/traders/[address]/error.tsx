"use client";

import { RouteError } from "@/components/seo/route-error";

export default function TraderError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteError
			title="Couldn't load this trader profile"
			description="We weren't able to fetch trading history for this wallet. The Polymarket API may be temporarily unavailable."
			error={error}
			reset={reset}
		/>
	);
}
