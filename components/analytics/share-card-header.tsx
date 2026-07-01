import Image from "next/image";
import type { ReactNode } from "react";

import { StructLogoMark } from "@/components/ui/svgs/struct-logo";
import { formatDateCompact, formatDateShort } from "@/lib/format";
import { normalizePolymarketS3ImageUrl } from "@/lib/image-url";
import {
	ANALYTICS_VIEW_LABELS,
	type AnalyticsPoint,
	type AnalyticsResolution,
	type AnalyticsSubject,
	type AnalyticsView,
} from "@/lib/struct/analytics-shared";

const RESOLUTION_WORD: Record<AnalyticsResolution, string> = {
	"60": "Hourly",
	"240": "4-hour",
	D: "Daily",
	W: "Weekly",
	M: "Monthly",
};

function subjectInitials(label: string): string {
	const words = label.trim().split(/\s+/).filter(Boolean);
	if (words.length === 0) return "";
	const letters =
		words.length === 1
			? words[0].slice(0, 2)
			: `${words[0][0]}${words[words.length - 1][0]}`;
	return letters.toUpperCase();
}

function SubjectMark({ subject }: { subject?: AnalyticsSubject }) {
	const rawImage = subject?.image?.trim();
	const image = rawImage
		? normalizePolymarketS3ImageUrl(rawImage) ?? rawImage
		: null;

	if (!image || !subject) {
		return <StructLogoMark className="size-13 shrink-0" />;
	}

	return (
		<div
			data-slot="avatar"
			className="relative size-13 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-muted"
		>
			<Image
				src={image}
				alt={subject.label}
				width={52}
				height={52}
				priority
				className="size-full rounded-lg object-cover"
			/>
			<span
				data-share-avatar-fallback="true"
				hidden
				className="absolute inset-0 flex items-center justify-center rounded-lg bg-muted text-base font-semibold text-muted-foreground"
			>
				{subjectInitials(subject.label)}
			</span>
		</div>
	);
}

function formatWindowLabel(points: AnalyticsPoint[]): string | null {
	if (points.length === 0) return null;
	const start = points[0].t;
	const end = points[points.length - 1].t;
	if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
	if (start === end) return formatDateShort(end);
	return `${formatDateCompact(start)} – ${formatDateShort(end)}`;
}

type ShareCardHeaderProps = {
	title: ReactNode;
	subject?: AnalyticsSubject;
	view: AnalyticsView;
	resolution: AnalyticsResolution;
	points: AnalyticsPoint[];
};

export function ShareCardHeader({
	title,
	subject,
	view,
	resolution,
	points,
}: ShareCardHeaderProps) {
	const windowLabel = formatWindowLabel(points);
	const chips = [RESOLUTION_WORD[resolution], ANALYTICS_VIEW_LABELS[view]];

	return (
		<div className="flex items-start justify-between gap-6">
			<div className="flex min-w-0 items-center gap-3">
				<SubjectMark subject={subject} />
				<div className="flex min-w-0 flex-col">
					<span className="truncate text-[22px] font-semibold leading-tight text-foreground">
						{title}
					</span>
					{subject ? (
						<span className="mt-1.5 flex min-w-0 items-center gap-2 text-sm">
							<span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
								{subject.type}
							</span>
							<span className="truncate font-medium text-foreground/80">
								{subject.label}
							</span>
						</span>
					) : null}
				</div>
			</div>
			<div className="flex shrink-0 flex-col items-end gap-2 text-right">
				{windowLabel ? (
					<span className="text-sm font-medium tabular-nums text-foreground/70">
						{windowLabel}
					</span>
				) : null}
				<div className="flex items-center gap-1.5">
					{chips.map((chip) => (
						<span
							key={chip}
							className="rounded-full border border-border/60 px-2 py-0.5 text-xs font-medium text-muted-foreground"
						>
							{chip}
						</span>
					))}
				</div>
			</div>
		</div>
	);
}
