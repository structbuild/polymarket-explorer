/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "../ui/badge";

export default function TraderPositions() {
	return (
		<table className="w-full rounded-lg overflow-hidden">
			<thead>
				<tr className="bg-card w-full text-left text-muted-foreground border-b">
					<th className="px-4 py-2 font-medium w-[40%]">Market</th>
					<th className="px-4 py-2 font-medium w-[20%]">Entry/Current Price</th>
					<th className="px-4 py-2 font-medium w-[20%]">Realized PnL</th>
					<th className="px-4 py-2 font-medium w-[20%]">Current Value</th>
				</tr>
			</thead>
			<tbody>
				{Array.from({ length: 10 }).map((_, index) => (
					<tr key={index} className="bg-card w-full text-left text-foreground/90">
						<td className="px-4 py-3">
							<div className="flex items-center gap-3">
								<img
									className="size-10 rounded-md"
									alt="Fed decision in April?"
									src="https://polymarket-upload.s3.us-east-2.amazonaws.com/jerome+powell+glasses1.png"
								/>
								<div className="space-y-0.5">
									<p className="text-base font-medium">Fed decision in April?</p>
									<div className="flex items-center gap-1.5">
										<Badge variant="positive">Yes</Badge>
										<p className="text-sm text-muted-foreground">250 Shares</p>
									</div>
								</div>
							</div>
						</td>
						<td className="px-4 py-2">
							<p>
								0.31¢ <span className="text-muted-foreground">/</span> 0.40¢
							</p>
						</td>
						<td className="px-4 py-2">
							<p className="text-emerald-500">$123.45 (+12.34%)</p>
						</td>
						<td className="px-4 py-2">
							<p>$123.45</p>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
