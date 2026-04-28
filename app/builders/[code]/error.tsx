"use client";

import { RouteError } from "@/components/seo/route-error";

export default function BuilderError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteError
			title="Couldn't load this builder"
			description="We weren't able to fetch stats for this builder. Try again in a few minutes."
			error={error}
			reset={reset}
		/>
	);
}
