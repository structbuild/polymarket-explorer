"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type RouteErrorProps = {
	title: string;
	description: string;
	error: Error & { digest?: string };
	reset: () => void;
};

export function RouteError({ title, description, error, reset }: RouteErrorProps) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
			<div className="mt-12 flex flex-col items-start gap-4 rounded-lg bg-card p-6 sm:p-10">
				<p className="text-sm font-medium text-destructive">Something went wrong</p>
				<h1 className="text-2xl font-medium sm:text-3xl">{title}</h1>
				<p className="max-w-prose text-sm text-muted-foreground sm:text-base">{description}</p>
				{error.digest && (
					<p className="font-mono text-xs text-muted-foreground/70">Error ref: {error.digest}</p>
				)}
				<div className="mt-2 flex flex-wrap gap-2">
					<Button onClick={reset} size="lg">Try again</Button>
				</div>
			</div>
		</div>
	);
}
