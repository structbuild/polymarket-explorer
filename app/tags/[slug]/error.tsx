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
			description="We weren't able to fetch markets in this category. Try again in a few minutes."
			error={error}
			reset={reset}
		/>
	);
}
