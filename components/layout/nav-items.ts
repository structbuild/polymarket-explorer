import type { Route } from "next";

export type NavItem = {
	href: Route;
	label: string;
	external?: boolean;
	primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
	{ href: "/events" as Route, label: "Events" },
	{ href: "/markets" as Route, label: "Markets" },
	{ href: "/combos" as Route, label: "Combos" },
	{ href: "/traders" as Route, label: "Traders" },
	{ href: "/builders" as Route, label: "Builders" },
	{ href: "/tags" as Route, label: "Tags" },
	{ href: "/analytics" as Route, label: "Analytics" },
	{ href: "/rewards" as Route, label: "Rewards" },
	{ href: "https://www.struct.to/rest-api" as Route, label: "API", external: true, primary: true },
];
