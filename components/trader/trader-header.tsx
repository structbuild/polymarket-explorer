import { CopyAddress } from "@/components/trader/copy-address";
import { CopyLink } from "@/components/trader/copy-link";
import { TraderAvatar } from "@/components/trader/trader-avatar";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/format";
import { formatNumber } from "@/lib/format";
import { ExternalLinkIcon } from "lucide-react";

type StatItemProps = {
	label: string;
	value: React.ReactNode;
};

function StatItem({ label, value }: StatItemProps) {
	return (
		<div className="min-w-0 space-y-1">
			<p className="text-xs leading-4 text-muted-foreground sm:text-sm">{label}</p>
			<p className="text-base font-medium break-words sm:text-lg">{value}</p>
		</div>
	);
}

type TraderHeaderProps = {
	address: string;
	displayName: string;
	profileImage?: string | null;
	firstTradeAt?: number | null;
	lastTradeAt?: number | null;
	totalBuys?: number | null;
	totalSells?: number | null;
	totalRedemptions?: number | null;
	totalMerges?: number | null;
	totalVolumeUsd?: number | null;
	totalFees?: number | null;
};

export function TraderHeader({
	address,
	displayName,
	profileImage,
	firstTradeAt,
	lastTradeAt,
	totalBuys,
	totalSells,
	totalRedemptions,
	totalMerges,
	totalVolumeUsd,
	totalFees,
}: TraderHeaderProps) {
	const activeSince = formatDateShort(firstTradeAt) || "Unknown";
	const lastActive = formatDateShort(lastTradeAt) || "Unknown";

	return (
		<div className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-lg bg-card p-4 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
			<div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
				<TraderAvatar
					displayName={displayName}
					profileImage={profileImage}
					className="size-16! sm:size-24!"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
					<div className="flex min-w-0 items-center gap-2">
						<h1
							className="min-w-0 truncate text-2xl font-medium"
							title={displayName}
						>
							{displayName}
						</h1>
						<CopyAddress address={address} />
					</div>
					<div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-4">
						<StatItem label="Active Since" value={activeSince} />
						<StatItem label="Last Active" value={lastActive} />
						<StatItem label="Buys" value={formatNumber(totalBuys ?? 0, { decimals: 0 })} />
						<StatItem label="Sells" value={formatNumber(totalSells ?? 0, { decimals: 0 })} />
						<StatItem label="Redemptions" value={formatNumber(totalRedemptions ?? 0, { decimals: 0 })} />
						<StatItem label="Merges" value={formatNumber(totalMerges ?? 0, { decimals: 0 })} />
						<StatItem label="Volume" value={formatNumber(totalVolumeUsd ?? 0, { compact: true, currency: true })} />
						<StatItem label="Fees" value={formatNumber(totalFees ?? 0, { compact: true, currency: true })} />
					</div>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2 lg:flex lg:w-auto lg:justify-end">
				<CopyLink />
				<Button
					className="w-full lg:w-fit"
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
