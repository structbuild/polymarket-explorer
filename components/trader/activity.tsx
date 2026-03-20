/* eslint-disable @next/next/no-img-element */
"use client";

import { ExternalLinkIcon } from "lucide-react";
import { Button } from "../ui/button";
import { TooltipWrapper } from "../ui/tooltip";

export default function TraderActivity() {
	return (
		<table className="w-full rounded-lg overflow-hidden">
			<thead>
				<tr className="bg-card w-full text-left text-muted-foreground border-b">
					<th className="px-4 py-2 font-medium w-[5%]">Age</th>
					<th className="px-4 py-2 font-medium w-[40%]">Market</th>
					<th className="px-4 py-2 font-medium w-[15%]">Outcome</th>
					<th className="px-4 py-2 font-medium w-[15%]">Shares</th>
					<th className="px-4 py-2 font-medium w-[15%]">Value</th>
					<th className="px-4 py-2 font-medium w-[10%]"></th>
				</tr>
			</thead>
			<tbody>
				{Array.from({ length: 10 }).map((_, index) => (
					<tr key={index} className="bg-card w-full text-left text-foreground/90">
						<td className="px-4 py-2">
							<p className="text-sm text-muted-foreground">1d</p>
						</td>
						<td className="px-4 py-3">
							<div className="flex items-center gap-3">
								<img
									className="size-8 rounded-md"
									alt="Fed decision in April?"
									src="https://polymarket-upload.s3.us-east-2.amazonaws.com/jerome+powell+glasses1.png"
								/>
								<p className="text-base font-medium">Fed decision in April?</p>
							</div>
						</td>
						<td className="px-4 py-2">
							<p>
								No <span className="text-muted-foreground">/</span> 0.40¢
							</p>
						</td>
						<td className="px-4 py-2">
							<p className="text-emerald-500">+123.45</p>
						</td>
						<td className="px-4 py-2">
							<p>$123.45</p>
						</td>
						<td className="px-4 py-2 flex justify-end">
							<TooltipWrapper content="View on Polygonscan">
								<Button variant="ghost" size="icon">
									<ExternalLinkIcon />
								</Button>
							</TooltipWrapper>
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}
