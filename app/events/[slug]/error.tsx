"use client";

import { RouteError } from "@/components/seo/route-error";

export default function EventError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteError
			title="Couldn't load this event"
			description="We weren't able to fetch live data for this Polymarket event. Try again in a few minutes."
			error={error}
			reset={reset}
		/>
	);
}
