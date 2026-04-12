import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateShort } from "@/lib/format";

type EventCardProps = {
	slug: string | null;
	title: string | null;
	imageUrl: string | null;
	marketCount: number;
	volume24hUsd: number | null;
	status: string | null;
	endTime: number | null;
};

function StatusBadge({ status }: { status: string }) {
	const variant = status === "open" ? "positive" : status === "closed" ? "negative" : "secondary";
	return <Badge variant={variant}>{status}</Badge>;
}

function EventCardContent({
	title,
	imageUrl,
	marketCount,
	volume24hUsd,
	status,
	endTime,
}: Omit<EventCardProps, "slug">) {
	return (
		<div className="flex gap-4">
			{imageUrl ? (
				<Image
					src={imageUrl}
					alt=""
					width={48}
					height={48}
					className="size-12 shrink-0 rounded-md object-cover"
				/>
			) : (
				<div className="size-12 shrink-0 rounded-md bg-muted" />
			)}
			<div className="min-w-0 flex-1 space-y-2">
				<p className="line-clamp-2 font-medium leading-snug">{title ?? "Untitled event"}</p>
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
					<span>
						{marketCount} {marketCount === 1 ? "market" : "markets"}
					</span>
					{volume24hUsd !== null && (
						<span>24h Vol {formatNumber(volume24hUsd, { compact: true, currency: true })}</span>
					)}
					{status ? <StatusBadge status={status} /> : null}
					{endTime !== null && <span>Ends {formatDateShort(endTime)}</span>}
				</div>
			</div>
		</div>
	);
}

export function EventCard({
	slug,
	title,
	imageUrl,
	marketCount,
	volume24hUsd,
	status,
	endTime,
}: EventCardProps) {
	const inner = (
		<EventCardContent
			title={title}
			imageUrl={imageUrl}
			marketCount={marketCount}
			volume24hUsd={volume24hUsd}
			status={status}
			endTime={endTime}
		/>
	);

	if (slug) {
		return (
			<Link
				href={`/event/${slug}` as Route}
				className="block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
			>
				{inner}
			</Link>
		);
	}

	return <div className="rounded-lg border bg-card p-4">{inner}</div>;
}
