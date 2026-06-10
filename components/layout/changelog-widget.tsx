"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
	ArrowRightIcon,
	ArrowUpRightIcon,
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
const AUTOPLAY_DURATION = 7000;

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

	const shownAtRef = useRef<number | null>(null);
	useEffect(() => {
		if (shownAtRef.current === null) shownAtRef.current = performance.now();
	}, []);

	const dismiss = useCallback(() => {
		const ids = recent.map((entry) => entry.id);
		setSeen((prev) => Array.from(new Set([...prev, ...ids])));
		const visibleForSeconds =
			shownAtRef.current === null ? null : Math.round((performance.now() - shownAtRef.current) / 100) / 10;
		posthog.capture("changelog_dismissed", { recent_count: recent.length, visible_for_seconds: visibleForSeconds });
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
			<ChangelogCarousel
				key={showOlder ? "all" : "recent"}
				entries={visible}
				olderCount={older.length}
				showOlder={showOlder}
				onToggleOlder={() => {
					posthog.capture("changelog_older_toggled", { expanded: !showOlder });
					setShowOlder((value) => !value);
				}}
			/>
		</div>
	);
}

function ChangelogCarousel({
	entries,
	olderCount,
	showOlder,
	onToggleOlder,
}: {
	entries: ChangelogEntry[];
	olderCount: number;
	showOlder: boolean;
	onToggleOlder: () => void;
}) {
	const count = entries.length;
	const [index, setIndex] = useState(0);
	const [progressKey, setProgressKey] = useState(0);
	const [paused, setPaused] = useState(false);

	const goTo = useCallback((next: number, method: "dot" | "swipe") => {
		setIndex(next);
		setProgressKey((key) => key + 1);
		posthog.capture("changelog_navigated", { method, to_index: next });
	}, []);

	const advance = useCallback(() => {
		setIndex((current) => (current + 1) % count);
		setProgressKey((key) => key + 1);
	}, [count]);

	const pause = useCallback(() => setPaused(true), []);
	const resume = useCallback(() => setPaused(false), []);

	const [dragX, setDragX] = useState(0);
	const [dragging, setDragging] = useState(false);
	const dragRef = useRef<{ pointerId: number; startX: number; startTime: number; width: number } | null>(null);

	const onPointerDown = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			if (count <= 1 || !event.isPrimary) return;
			dragRef.current = {
				pointerId: event.pointerId,
				startX: event.clientX,
				startTime: event.timeStamp,
				width: event.currentTarget.offsetWidth,
			};
			pause();
		},
		[count, pause],
	);

	const onPointerMove = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const drag = dragRef.current;
			if (!drag || event.pointerId !== drag.pointerId) return;
			let delta = event.clientX - drag.startX;
			if (!dragging) {
				if (Math.abs(delta) < 6) return;
				setDragging(true);
				event.currentTarget.setPointerCapture(event.pointerId);
			}
			if ((index === 0 && delta > 0) || (index === count - 1 && delta < 0)) delta /= 3;
			setDragX(delta);
		},
		[count, dragging, index],
	);

	const settleDrag = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			dragRef.current = null;
			setDragging(false);
			setDragX(0);
			if (event.pointerType !== "mouse") resume();
		},
		[resume],
	);

	const onPointerUp = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const drag = dragRef.current;
			if (!drag || event.pointerId !== drag.pointerId) return;
			settleDrag(event);
			const delta = event.clientX - drag.startX;
			const elapsed = event.timeStamp - drag.startTime;
			const isFlick = Math.abs(delta) > 24 && elapsed < 250;
			if (Math.abs(delta) < drag.width / 4 && !isFlick) return;
			if (delta < 0 && index < count - 1) goTo(index + 1, "swipe");
			else if (delta > 0 && index > 0) goTo(index - 1, "swipe");
		},
		[count, goTo, index, settleDrag],
	);

	const onPointerCancel = useCallback(
		(event: React.PointerEvent<HTMLDivElement>) => {
			const drag = dragRef.current;
			if (!drag || event.pointerId !== drag.pointerId) return;
			settleDrag(event);
		},
		[settleDrag],
	);

	const active = entries[index] ?? entries[0];

	return (
		<div onMouseEnter={pause} onMouseLeave={resume} onFocusCapture={pause} onBlurCapture={resume}>
			<div
				className={cn("touch-pan-y overflow-hidden", count > 1 && "cursor-grab active:cursor-grabbing")}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerCancel}
			>
				<div
					className={cn(
						"flex [&_img]:pointer-events-none",
						dragging
							? "select-none"
							: "transition-transform duration-300 ease-[cubic-bezier(0.215,0.61,0.355,1)] motion-reduce:transition-none",
					)}
					style={{ transform: `translate3d(calc(${index * -100}% + ${dragX}px), 0, 0)` }}
				>
					{entries.map((entry, i) => {
						const offset = (i - index + count) % count;
						const nearby = offset <= 1 || offset === count - 1;
						return (
							<div
								key={entry.id}
								aria-hidden={i !== index}
								className={cn("w-full shrink-0 backface-hidden", !nearby && "invisible")}
							>
								<ChangelogCard entry={entry} />
							</div>
						);
					})}
				</div>
			</div>
			<div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
				{count > 1 ? (
					<div className="flex items-center">
						{entries.map((entry, i) => (
							<button
								key={entry.id}
								type="button"
								aria-label={`Go to update ${i + 1}`}
								aria-current={i === index}
								onClick={() => goTo(i, "dot")}
								className="group flex h-7 items-center px-1"
							>
								<span
									className={cn(
										"h-2 overflow-hidden rounded-full transition-all",
										i === index ? "w-7 bg-foreground/20" : "w-2 bg-foreground/25 group-hover:bg-foreground/50",
									)}
								>
									{i === index ? (
										<span
											key={progressKey}
											onAnimationEnd={advance}
											className="block h-full w-full origin-left rounded-full bg-foreground"
											style={{
												animation: `changelogProgress ${AUTOPLAY_DURATION}ms linear forwards`,
												animationPlayState: paused ? "paused" : "running",
											}}
										/>
									) : null}
								</span>
							</button>
						))}
					</div>
				) : (
					<span />
				)}
				<div className="flex items-center gap-1.5">
					{olderCount > 0 ? (
						<button
							type="button"
							onClick={onToggleOlder}
							className="rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
						>
							{showOlder ? "Show less" : `Older (${olderCount})`}
						</button>
					) : null}
					<ChangelogCTA href={active.href} />
				</div>
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
