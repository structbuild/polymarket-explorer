import { CopyAddress } from "@/components/trader/copy-address";
import { TraderAvatar } from "@/components/trader/trader-avatar";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { ExternalLinkIcon } from "lucide-react";

type StatItemProps = {
	label: string;
	value: React.ReactNode;
};

function StatItem({ label, value }: StatItemProps) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs leading-4 text-muted-foreground sm:text-sm">{label}</p>
			<p className="text-base font-medium wrap-break-word sm:text-lg">{value}</p>
		</div>
	);
}

type TraderHeaderProps = {
	address: string;
	displayName: string;
	profileImage?: string | null;
	firstTradeAt?: number | null;
	totalBuys?: number | null;
	totalSells?: number | null;
	totalRedemptions?: number | null;
	totalVolumeUsd?: number | null;
};

export function TraderHeader({
	address,
	displayName,
	profileImage,
	firstTradeAt,
	totalBuys,
	totalSells,
	totalRedemptions,
	totalVolumeUsd,
}: TraderHeaderProps) {
	const activeSince = firstTradeAt
		? new Date(firstTradeAt * 1000).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: "Unknown";

	return (
		<div className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-lg bg-card p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
			<div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
				<TraderAvatar displayName={displayName} profileImage={profileImage} />
				<div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
					<div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
						<h1
							className="w-full min-w-0 max-w-full truncate text-2xl font-medium sm:flex-1 sm:min-w-0"
							title={displayName}
						>
							{displayName}
						</h1>
						<div className="shrink-0 self-start sm:self-auto">
							<CopyAddress address={address} />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4">
						<StatItem label="Active Since" value={activeSince} />
						<StatItem label="Buys" value={formatNumber(totalBuys ?? 0, { decimals: 0 })} />
						<StatItem label="Sells" value={formatNumber(totalSells ?? 0, { decimals: 0 })} />
						<StatItem label="Redemptions" value={formatNumber(totalRedemptions ?? 0, { decimals: 0 })} />
						<StatItem label="Volume" value={formatNumber(totalVolumeUsd ?? 0, { compact: true, currency: true })} />
					</div>
				</div>
			</div>

			<div className="flex w-full items-center justify-stretch gap-2 lg:w-auto lg:justify-end">
				<Button
					className="w-full sm:w-fit"
					size="lg"
					nativeButton={false}
					render={<a href={`https://polymarket.com/${address}`} rel="noreferrer" target="_blank" />}
				>
					View Profile
					<ExternalLinkIcon />
				</Button>
			</div>
		</div>
	);
}
