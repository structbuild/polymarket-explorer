/* eslint-disable @next/next/no-img-element */
"use client";

import { ExternalLinkIcon } from "lucide-react";
import { Button } from "../ui/button";
import { TooltipWrapper } from "../ui/tooltip";

const activities = Array.from({ length: 10 }, (_, index) => ({
	id: index,
	age: "1d",
	question: "Fed decision in April?",
	outcome: "No",
	price: "0.40¢",
	shares: "+123.45",
	value: "$123.45",
	image: "https://polymarket-upload.s3.us-east-2.amazonaws.com/jerome+powell+glasses1.png",
}));

export default function TraderActivity() {
	return (
		<div className="overflow-hidden rounded-lg bg-card">
			<div className="overflow-x-auto overscroll-x-contain">
				<table className="w-full min-w-[780px]">
					<thead>
						<tr className="w-full border-b bg-card text-left text-muted-foreground">
							<th className="w-[5%] px-4 py-2 font-medium">Age</th>
							<th className="w-[40%] px-4 py-2 font-medium">Market</th>
							<th className="w-[15%] px-4 py-2 font-medium">Outcome</th>
							<th className="w-[15%] px-4 py-2 font-medium">Shares</th>
							<th className="w-[15%] px-4 py-2 font-medium">Value</th>
							<th className="w-[10%] px-4 py-2 font-medium"></th>
						</tr>
					</thead>
					<tbody>
						{activities.map((activity) => (
							<tr key={activity.id} className="w-full bg-card text-left text-foreground/90">
								<td className="px-4 py-2">
									<p className="text-sm text-muted-foreground">{activity.age}</p>
								</td>
								<td className="px-4 py-3">
									<div className="flex items-center gap-3">
										<img className="size-8 rounded-md" alt={activity.question} src={activity.image} />
										<p className="text-base font-medium">{activity.question}</p>
									</div>
								</td>
								<td className="px-4 py-2">
									<p>
										{activity.outcome} <span className="text-muted-foreground">/</span> {activity.price}
									</p>
								</td>
								<td className="px-4 py-2">
									<p className="text-emerald-500">{activity.shares}</p>
								</td>
								<td className="px-4 py-2">
									<p>{activity.value}</p>
								</td>
								<td className="px-4 py-2">
									<div className="flex justify-end">
										<TooltipWrapper content="View on Polygonscan">
											<Button variant="ghost" size="icon" aria-label="View on Polygonscan">
												<ExternalLinkIcon className="size-4" />
											</Button>
										</TooltipWrapper>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
