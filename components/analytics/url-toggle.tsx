"use client";

import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TooltipWrapper } from "@/components/ui/tooltip";

const urlToggleScrollStoragePrefix = "url-toggle:scroll:";

function getSessionStorageItem(key: string) {
	try {
		return window.sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

function setSessionStorageItem(key: string, value: string) {
	try {
		window.sessionStorage.setItem(key, value);
	} catch {
		// Session storage is only a cross-remount fallback for scroll restoration.
	}
}

function removeSessionStorageItem(key: string) {
	try {
		window.sessionStorage.removeItem(key);
	} catch {
		// Session storage is only a cross-remount fallback for scroll restoration.
	}
}

function restoreScrollY(scrollY: number) {
	window.scrollTo({ top: scrollY, left: window.scrollX, behavior: "instant" });
}

function scheduleScrollYPreservation(scrollY: number) {
	restoreScrollY(scrollY);

	const animationFrameId = window.requestAnimationFrame(() => restoreScrollY(scrollY));
	const timeoutIds = [0, 50, 100, 200, 400].map((delay) =>
		window.setTimeout(() => restoreScrollY(scrollY), delay),
	);

	return () => {
		window.cancelAnimationFrame(animationFrameId);
		timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
	};
}

type Props<T extends string> = {
	paramKey: string;
	value: T;
	options: readonly T[];
	labels: Record<T, string>;
	defaultValue: T;
	ariaLabelPrefix?: string;
	descriptions?: Partial<Record<T, string>>;
	transformParams?: (params: URLSearchParams, next: T) => void;
};

export function AnalyticsUrlToggle<T extends string>({
	paramKey,
	value,
	options,
	labels,
	defaultValue,
	ariaLabelPrefix = "Show",
	descriptions,
	transformParams,
}: Props<T>) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();
	const shouldScrollToToggleRef = useRef(false);
	const scrollStorageKey = `${urlToggleScrollStoragePrefix}${pathname}:${paramKey}`;

	useEffect(() => {
		const storedScrollY = getSessionStorageItem(scrollStorageKey);

		if (!shouldScrollToToggleRef.current && !storedScrollY) {
			return;
		}

		shouldScrollToToggleRef.current = false;
		removeSessionStorageItem(scrollStorageKey);

		const scrollY = Number(storedScrollY);

		if (!Number.isFinite(scrollY)) {
			return;
		}

		return scheduleScrollYPreservation(scrollY);
	}, [scrollStorageKey, value]);

	function handleChange(raw: string | string[] | null) {
		const next = Array.isArray(raw) ? raw[0] : raw;
		if (!next) return;
		const candidate = options.includes(next as T) ? (next as T) : defaultValue;
		if (candidate === value) return;

		const params = new URLSearchParams(searchParams.toString());
		if (candidate === defaultValue) {
			params.delete(paramKey);
		} else {
			params.set(paramKey, candidate);
		}
		transformParams?.(params, candidate);

		const query = params.toString();
		const href = (query ? `${pathname}?${query}` : pathname) as Route;
		const scrollY = window.scrollY;

		shouldScrollToToggleRef.current = true;
		setSessionStorageItem(scrollStorageKey, String(scrollY));
		scheduleScrollYPreservation(scrollY);
		startTransition(() => {
			router.replace(href, { scroll: false });
		});
	}

	return (
		<div>
			<ToggleGroup
				value={[value]}
				onValueChange={handleChange}
				variant="outline"
				size="sm"
				data-pending={isPending ? "" : undefined}
				className="data-[pending]:opacity-70"
			>
				{options.map((opt) => {
					const item = (
						<ToggleGroupItem
							key={opt}
							value={opt}
							aria-label={`${ariaLabelPrefix} ${labels[opt]}`}
						>
							{labels[opt]}
						</ToggleGroupItem>
					);
					const description = descriptions?.[opt];
					return description ? (
						<TooltipWrapper key={opt} content={description}>
							{item}
						</TooltipWrapper>
					) : (
						item
					);
				})}
			</ToggleGroup>
		</div>
	);
}
