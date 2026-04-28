import type { TopTraderRow } from "@structbuild/sdk";
import type { Route } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { formatNumber } from "@/lib/format";
import { truncateAddress } from "@/lib/utils";

type BuilderTopTradersProps = {
	rows: TopTraderRow[];
};

export function BuilderTopTraders({ rows }: BuilderTopTradersProps) {
	if (rows.length === 0) {
		return (
			<Card variant="analytics">
				<CardContent className="text-sm text-muted-foreground">
					No trader activity in this window.
				</CardContent>
			</Card>
		);
	}

	return (
		<Card variant="analytics">
			<CardContent className="space-y-3">
				<div className="flex items-center gap-1.5">
					<h3 className="text-sm font-medium text-muted-foreground">Top traders</h3>
					<InfoTooltip content="Highest-volume traders routed through this builder." />
				</div>

				<div className="overflow-x-auto">
					<table className="w-full text-sm tabular-nums">
						<thead>
							<tr className="text-left text-muted-foreground">
								<th className="px-2 py-1 font-normal">#</th>
								<th className="px-2 py-1 font-normal">Trader</th>
								<th className="px-2 py-1 font-normal">Volume</th>
								<th className="px-2 py-1 font-normal">Trades</th>
								<th className="px-2 py-1 font-normal">Fees</th>
								<th className="px-2 py-1 font-normal">Builder fees</th>
							</tr>
						</thead>
						<tbody>
							{rows.map((row, index) => (
								<tr key={row.trader} className="border-t border-border/50">
									<td className="px-2 py-1 text-muted-foreground">{index + 1}</td>
									<td className="whitespace-nowrap px-2 py-1">
										<Link
											href={`/traders/${row.trader}` as Route}
											prefetch={false}
											title={row.trader}
											className="font-mono text-foreground underline-offset-4 hover:underline"
										>
											{truncateAddress(row.trader, 4)}
										</Link>
									</td>
									<td className="px-2 py-1 text-foreground">
										{formatNumber(row.volume_usd, { compact: true, currency: true })}
									</td>
									<td className="px-2 py-1 text-foreground">
										{formatNumber(row.txn_count, { compact: true })}
									</td>
									<td className="px-2 py-1 text-foreground">
										{formatNumber(row.fees_usd, { compact: true, currency: true })}
									</td>
									<td className="px-2 py-1 text-foreground">
										{formatNumber(row.builder_fees, { compact: true, currency: true })}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</CardContent>
		</Card>
	);
}
