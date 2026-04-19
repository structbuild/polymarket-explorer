"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Toggle } from "@/components/ui/toggle";

export function AnalyticsCapToggle({
	cap,
	defaultCap = false,
}: {
	cap: boolean;
	defaultCap?: boolean;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	function handleChange(pressed: boolean) {
		const params = new URLSearchParams(searchParams.toString());
		if (pressed === defaultCap) {
			params.delete("cap");
		} else {
			params.set("cap", pressed ? "1" : "0");
		}
		const query = params.toString();
		const href = (query ? `${pathname}?${query}` : pathname) as Route;
		startTransition(() => {
			router.replace(href, { scroll: false });
		});
	}

	return (
		<Toggle
			pressed={cap}
			onPressedChange={handleChange}
			variant="outline"
			size="sm"
			aria-label="Cap charts to market end time"
			data-pending={isPending ? "" : undefined}
			className="data-[pending]:opacity-70"
		>
			Cap to end
		</Toggle>
	);
}
