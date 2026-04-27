import type { Route } from "next";

export type NavItem = {
	href: Route;
	label: string;
	external?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
	{ href: "/markets" as Route, label: "Markets" },
	{ href: "/traders" as Route, label: "Traders" },
	{ href: "/builders" as Route, label: "Builders" },
	{ href: "/tags" as Route, label: "Tags" },
	{ href: "/analytics" as Route, label: "Analytics" },
	{ href: "/rewards" as Route, label: "Rewards" },
	{ href: "https://www.struct.to/rest-api" as Route, label: "API", external: true },
];
