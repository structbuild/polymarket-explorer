import { StructLogoMark } from "@/components/ui/svgs/struct-logo";
import { getSiteUrl } from "@/lib/env";

const TIMESTAMP_FORMATTER = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
	timeZone: "UTC",
});

function buildAttributionUrl(pathname: string): string {
	const site = getSiteUrl();
	const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
	const path = normalizedPath === "/" ? "" : normalizedPath;
	return `${site.host}${path}`;
}

type AnalyticsAttributionProps = {
	pathname: string;
	refreshedAt: Date;
};

export function AnalyticsAttribution({
	pathname,
	refreshedAt,
}: AnalyticsAttributionProps) {
	const displayUrl = buildAttributionUrl(pathname);
	const refreshedLabel = `${TIMESTAMP_FORMATTER.format(refreshedAt)} UTC`;
	return (
		<div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground/80">
			<div className="flex min-w-0 items-center gap-2">
				<StructLogoMark className="size-5 shrink-0" />
				<span className="truncate tabular-nums">{displayUrl}</span>
			</div>
			<span className="shrink-0 tabular-nums">{refreshedLabel}</span>
		</div>
	);
}
