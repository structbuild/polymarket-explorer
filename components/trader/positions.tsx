/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "../ui/badge";

const positions = Array.from({ length: 10 }, (_, index) => ({
	id: index,
	question: "Fed decision in April?",
	outcome: "Yes",
	shares: "250 Shares",
	entryPrice: "0.31¢",
	currentPrice: "0.40¢",
	realizedPnl: "$123.45 (+12.34%)",
	currentValue: "$123.45",
	image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/jerome+powell+glasses1.png",
}));

export default function TraderPositions() {
	return (
		<div className="overflow-hidden rounded-lg bg-card">
			<div className="overflow-x-auto overscroll-x-contain">
				<table className="w-full min-w-[900px]">
					<thead>
						<tr className="w-full border-b bg-card text-left text-muted-foreground">
							<th className="w-[40%] px-4 py-2 font-medium">Market</th>
							<th className="w-[20%] px-4 py-2 font-medium">Entry/Current Price</th>
							<th className="w-[20%] px-4 py-2 font-medium">Realized PnL</th>
							<th className="w-[20%] px-4 py-2 font-medium">Current Value</th>
						</tr>
					</thead>
					<tbody>
						{positions.map((position) => (
							<tr key={position.id} className="w-full bg-card text-left text-foreground/90">
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<img className="size-10 rounded-md" alt={position.question} src={position.image} />
										<div className="space-y-0.5">
											<p className="text-base font-medium">{position.question}</p>
											<div className="flex items-center gap-1.5">
												<Badge variant="positive">{position.outcome}</Badge>
												<p className="text-sm text-muted-foreground">{position.shares}</p>
											</div>
										</div>
									</div>
								</td>
								<td className="px-4 py-2">
									<p>
										{position.entryPrice} <span className="text-muted-foreground">/</span> {position.currentPrice}
									</p>
								</td>
								<td className="px-4 py-2">
									<p className="text-emerald-500">{position.realizedPnl}</p>
								</td>
								<td className="px-4 py-2">
									<p>{position.currentValue}</p>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
