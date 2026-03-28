export const traderTabValues = ["active", "closed", "activity"] as const;
export const maxTraderPageNumber = 1000;
export type TraderTab = (typeof traderTabValues)[number];
