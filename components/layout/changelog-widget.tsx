"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
	ArrowRightIcon,
	ArrowUpRightIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	type LucideIcon,
	SparklesIcon,
	WandSparklesIcon,
	WrenchIcon,
	XIcon,
} from "lucide-react";
import posthog from "posthog-js";

import { ExternalLink } from "@/components/ui/external-link";
import { CHANGELOG_ILLUSTRATIONS } from "@/components/layout/changelog-illustrations";
import {
	CHANGELOG,
	CHANGELOG_RECENT_WINDOW_DAYS,
	CHANGELOG_SEEN_STORAGE_KEY,
	entryDateSeconds,
	type ChangelogEntry,
	type ChangelogTag,
} from "@/lib/changelog";
import { useLocalStorage } from "@/lib/hooks/use-local-storage";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const AUTOPLAY_DURATION = 3600;

let cachedNowMs: number | null = null;

function getClientNowMs() {
	if (cachedNowMs === null) {
		cachedNowMs = Date.now();
	}
	return cachedNowMs;
}

function subscribeNoop() {
	return () => {};
}

const TAG_META: Record<ChangelogTag, { label: string; icon: LucideIcon; gradient: string; eyebrowClass: string }> = {
	new: { label: "New", icon: SparklesIcon, gradient: "from-emerald-500/25 to-emerald-500/3", eyebrowClass: "text-emerald-500" },
	improved: { label: "Improved", icon: WandSparklesIcon, gradient: "from-violet-500/25 to-violet-500/3", eyebrowClass: "text-violet-500" },
	fixed: { label: "Fixed", icon: WrenchIcon, gradient: "from-amber-500/25 to-amber-500/3", eyebrowClass: "text-amber-500" },
};

export function ChangelogWidget() {
	const [seen, setSeen] = useLocalStorage<string[]>(CHANGELOG_SEEN_STORAGE_KEY, []);
	const [showOlder, setShowOlder] = useState(false);
	const nowMs = useSyncExternalStore(subscribeNoop, getClientNowMs, () => 0);
	const mounted = nowMs > 0;

	const { recent, older } = useMemo(() => {
		const cutoff = nowMs - CHANGELOG_RECENT_WINDOW_DAYS * DAY_MS;
		const recentEntries: ChangelogEntry[] = [];
		const olderEntries: ChangelogEntry[] = [];
		for (const entry of CHANGELOG) {
			if (entryDateSeconds(entry) * 1000 >= cutoff) {
				recentEntries.push(entry);
			} else {
				olderEntries.push(entry);
			}
		}
		return { recent: recentEntries, older: olderEntries };
	}, [nowMs]);

	const seenSet = useMemo(() => new Set(seen), [seen]);
	const unseenCount = useMemo(
		() => recent.reduce((count, entry) => (seenSet.has(entry.id) ? count : count + 1), 0),
		[recent, seenSet],
	);

	const dismiss = useCallback(() => {
		const ids = recent.map((entry) => entry.id);
		setSeen((prev) => Array.from(new Set([...prev, ...ids])));
		posthog.capture("changelog_dismissed", { recent_count: recent.length });
	}, [recent, setSeen]);

	const visible = showOlder ? [...recent, ...older] : recent;

	if (!mounted || unseenCount === 0 || visible.length === 0) return null;

	return (
		<div className="fixed right-4 bottom-4 z-40 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10 duration-300 animate-in fade-in-0 slide-in-from-bottom-4 sm:right-6 sm:bottom-6 sm:w-96">
			<style>{`@keyframes changelogProgress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
			<button
				type="button"
				onClick={dismiss}
				aria-label="Dismiss"
				className="absolute top-2.5 right-2.5 z-30 flex size-6 items-center justify-center rounded-full bg-foreground/10 text-foreground/70 backdrop-blur-sm transition-colors hover:bg-foreground/20 hover:text-foreground"
			>
				<XIcon className="size-3.5" />
			</button>
			<ChangelogCarousel key={showOlder ? "all" : "recent"} entries={visible} />
			{older.length > 0 ? (
				<div className="border-t border-border px-2 py-1.5">
					<button
						type="button"
						onClick={() => setShowOlder((value) => !value)}
						className="w-full rounded-md px-2 py-1 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
					>
						{showOlder ? "Show less" : `Show older updates (${older.length})`}
					</button>
				</div>
			) : null}
		</div>
	);
}

function ChangelogCarousel({ entries }: { entries: ChangelogEntry[] }) {
	const count = entries.length;
	const [index, setIndex] = useState(0);
	const [progressKey, setProgressKey] = useState(0);
	const [paused, setPaused] = useState(false);
	const pausedRef = useRef(false);

	useEffect(() => {
		if (count <= 1) return;
		const id = setInterval(() => {
			if (pausedRef.current) return;
			setIndex((current) => (current + 1) % count);
			setProgressKey((key) => key + 1);
		}, AUTOPLAY_DURATION);
		return () => clearInterval(id);
	}, [count]);

	const goTo = useCallback((next: number) => {
		setIndex(next);
		setProgressKey((key) => key + 1);
	}, []);

	const goRelative = useCallback(
		(delta: number) => {
			setIndex((current) => (current + delta + count) % count);
			setProgressKey((key) => key + 1);
		},
		[count],
	);

	const pause = useCallback(() => {
		pausedRef.current = true;
		setPaused(true);
	}, []);

	const resume = useCallback(() => {
		pausedRef.current = false;
		setPaused(false);
	}, []);

	const active = entries[index] ?? entries[0];

	return (
		<div onMouseEnter={pause} onMouseLeave={resume} onFocusCapture={pause} onBlurCapture={resume}>
			<div className="relative">
				{count > 1 ? (
					<div className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-foreground/10">
						<div
							key={progressKey}
							className="h-full w-full origin-left bg-foreground/60"
							style={{
								animation: `changelogProgress ${AUTOPLAY_DURATION}ms linear forwards`,
								animationPlayState: paused ? "paused" : "running",
							}}
						/>
					</div>
				) : null}
				<div className="grid">
					{entries.map((entry, i) => (
						<div
							key={entry.id}
							aria-hidden={i !== index}
							className={cn(
								"col-start-1 row-start-1 transition-opacity duration-500 ease-out",
								i === index ? "opacity-100" : "pointer-events-none opacity-0",
							)}
						>
							<ChangelogCard entry={entry} />
						</div>
					))}
				</div>
			</div>
			<div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2.5">
				{count > 1 ? (
					<div className="flex items-center gap-1.5">
						<button
							type="button"
							aria-label="Previous update"
							onClick={() => goRelative(-1)}
							className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							<ChevronLeftIcon className="size-4" />
						</button>
						<div className="flex items-center justify-center gap-1.5">
							{entries.map((entry, i) => (
								<button
									key={entry.id}
									type="button"
									aria-label={`Go to update ${i + 1}`}
									aria-current={i === index}
									onClick={() => goTo(i)}
									className={cn(
										"h-1.5 rounded-full transition-all",
										i === index ? "w-4 bg-foreground" : "w-1.5 bg-foreground/25 hover:bg-foreground/40",
									)}
								/>
							))}
						</div>
						<button
							type="button"
							aria-label="Next update"
							onClick={() => goRelative(1)}
							className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							<ChevronRightIcon className="size-4" />
						</button>
					</div>
				) : (
					<span />
				)}
				<ChangelogCTA href={active.href} />
			</div>
		</div>
	);
}

function ChangelogCard({ entry }: { entry: ChangelogEntry }) {
	const tag = entry.tag ? TAG_META[entry.tag] : null;
	const Icon = tag?.icon ?? SparklesIcon;
	const Illustration = CHANGELOG_ILLUSTRATIONS[entry.id];

	return (
		<div>
			<div className="relative aspect-video w-full overflow-hidden bg-muted">
				{entry.image ? (
					<Image
						src={entry.image}
						alt={entry.title}
						fill
						sizes="(max-width: 640px) 100vw, 384px"
						className="object-cover"
					/>
				) : Illustration ? (
					<Illustration />
				) : (
					<div className={cn("flex h-full w-full items-center justify-center bg-linear-to-br", tag?.gradient ?? "from-primary/25 to-primary/3")}>
						<Icon className="size-9 text-foreground/40" />
					</div>
				)}
			</div>
			<div className="px-4 pt-3.5 pb-4">
				{tag ? <p className={cn("text-[11px] font-medium", tag.eyebrowClass)}>{tag.label}</p> : null}
				<h3 className="mt-1 text-[15px] leading-snug font-medium text-foreground">{entry.title}</h3>
				<p className="mt-1.5 line-clamp-2 min-h-[2lh] text-xs leading-relaxed text-muted-foreground">{entry.description}</p>
			</div>
		</div>
	);
}

const CTA_CLASS =
	"inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90";

function ChangelogCTA({ href }: { href: string }) {
	if (href.startsWith("http")) {
		return (
			<ExternalLink href={href} linkType="changelog_item" className={cn(CTA_CLASS)}>
				Explore
				<ArrowUpRightIcon className="size-3.5" />
			</ExternalLink>
		);
	}

	return (
		<Link
			href={href as Route}
			className={cn(CTA_CLASS)}
			onClick={() => posthog.capture("changelog_link_clicked", { href })}
		>
			Explore
			<ArrowRightIcon className="size-3.5" />
		</Link>
	);
}
