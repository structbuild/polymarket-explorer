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
	const rootRef = useRef<HTMLDivElement>(null);
	const shouldScrollToToggleRef = useRef(false);
	const scrollStorageKey = `${urlToggleScrollStoragePrefix}${pathname}:${paramKey}`;

	useEffect(() => {
		const shouldRestoreFromStorage = getSessionStorageItem(scrollStorageKey) === "1";

		if (!shouldScrollToToggleRef.current && !shouldRestoreFromStorage) {
			return;
		}

		shouldScrollToToggleRef.current = false;
		removeSessionStorageItem(scrollStorageKey);

		const scrollToToggle = () => {
			rootRef.current?.scrollIntoView({ block: "nearest" });
		};

		const animationFrameId = window.requestAnimationFrame(scrollToToggle);
		const timeoutId = window.setTimeout(scrollToToggle, 100);
		const settledTimeoutId = window.setTimeout(scrollToToggle, 300);

		return () => {
			window.cancelAnimationFrame(animationFrameId);
			window.clearTimeout(timeoutId);
			window.clearTimeout(settledTimeoutId);
		};
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
		shouldScrollToToggleRef.current = true;
		setSessionStorageItem(scrollStorageKey, "1");
		startTransition(() => {
			router.replace(href, { scroll: false });
		});
	}

	return (
		<div ref={rootRef} className="scroll-mt-6">
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
