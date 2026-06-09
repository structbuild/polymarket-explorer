import { CopyAddress } from "@/components/trader/copy-address";
import { CopyLink } from "@/components/trader/copy-link";
import { TraderAvatar } from "@/components/trader/trader-avatar";
import { ViewProfileButton } from "@/components/trader/view-profile-button";
import { Volume } from "@/components/ui/volume";
import { formatDateShort } from "@/lib/format";
import { formatNumber } from "@/lib/format";
import type { GlobalEntry } from "@structbuild/sdk";

type StatItemProps = {
	label: string;
	value: React.ReactNode;
};

function StatItem({ label, value }: StatItemProps) {
	return (
		<div className="min-w-0 space-y-1 sm:shrink-0">
			<p className="text-xs leading-4 text-muted-foreground sm:whitespace-nowrap sm:text-sm">{label}</p>
			<p className="text-base font-medium break-words sm:text-lg sm:break-normal sm:whitespace-nowrap">{value}</p>
		</div>
	);
}

type TraderHeaderProps = {
	address: string;
	displayName: string;
	profileImage?: string | null;
	pnlSummary: GlobalEntry | null;
};

export function TraderHeader({
	address,
	displayName,
	profileImage,
	pnlSummary,
}: TraderHeaderProps) {
	const activeSince = formatDateShort(pnlSummary?.first_trade_at) || "Unknown";
	const lastActive = formatDateShort(pnlSummary?.last_trade_at) || "Unknown";

	return (
		<div className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-lg bg-card p-4 sm:p-6">
			<div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
				<TraderAvatar
					displayName={displayName}
					profileImage={profileImage}
					className="size-16! sm:size-24!"
				/>
				<div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
					<div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
						<div className="flex min-w-0 items-center gap-2">
							<h1
								className="min-w-0 truncate text-2xl font-medium"
								title={displayName}
							>
								{displayName}
							</h1>
							<CopyAddress address={address} />
						</div>
						<div className="grid grid-cols-2 gap-2 lg:flex lg:w-auto lg:shrink-0 lg:justify-end">
							<CopyLink />
							<ViewProfileButton address={address} />
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4 sm:flex sm:flex-nowrap sm:items-center sm:gap-x-8 sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden">
						<StatItem label="Active Since" value={activeSince} />
						<StatItem label="Last Active" value={lastActive} />
						<StatItem
							label="Positions Value"
							value={formatNumber(pnlSummary?.open_positions_value ?? 0, { currency: true, compact: true })}
						/>
						<StatItem
							label="Volume"
							value={
								<Volume
									usd={pnlSummary?.total_volume_usd ?? null}
									shares={null}
									className="text-foreground/90 tabular-nums"
								/>
							}
						/>
						<StatItem
							label="Fees Paid"
							value={formatNumber(pnlSummary?.total_fees ?? 0, { currency: true, compact: true })}
						/>
						<StatItem label="Buys" value={formatNumber(pnlSummary?.total_buys ?? 0, { decimals: 0 })} />
						<StatItem label="Sells" value={formatNumber(pnlSummary?.total_sells ?? 0, { decimals: 0 })} />
						<StatItem label="Redeems" value={formatNumber(pnlSummary?.total_redemptions ?? 0, { decimals: 0 })} />
						<StatItem label="Merges" value={formatNumber(pnlSummary?.total_merges ?? 0, { decimals: 0 })} />
						<StatItem label="Splits" value={formatNumber(pnlSummary?.total_splits ?? 0, { decimals: 0 })} />
						<StatItem label="Converts" value={formatNumber(pnlSummary?.converted_count ?? 0, { decimals: 0 })} />
					</div>
				</div>
			</div>
		</div>
	);
}
