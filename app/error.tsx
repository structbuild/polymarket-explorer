"use client";

import { RouteError } from "@/components/seo/route-error";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<RouteError
			title="We hit an unexpected error"
			description="Something went wrong loading this page. Please try again — if the problem persists, the data source may be temporarily unavailable."
			error={error}
			reset={reset}
		/>
	);
}
