export type MarketOutcome = {
  label: string;
  probability: number | null;
};

export type MarketSummary = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  probability: number | null;
  volume: number | null;
  endDate: string | null;
  eventTitle: string | null;
  conditionId: string | null;
  outcomes: MarketOutcome[];
};

export type MarketDetail = MarketSummary;

