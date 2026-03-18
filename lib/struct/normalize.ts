import type { MarketDetail, MarketOutcome, MarketSummary } from "@/lib/struct/types";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null
    ? (value as JsonRecord)
    : null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[$,%_\s]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizePercent(value: number | null) {
  if (value === null) {
    return null;
  }

  if (value >= 0 && value <= 1) {
    return Math.round(value * 1000) / 10;
  }

  if (value <= 100) {
    return Math.round(value * 10) / 10;
  }

  return null;
}

function readString(record: JsonRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
}

function readNumber(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const parsed = parseNumber(record[key]);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function readArray(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function extractCollection(response: unknown) {
  const root = asRecord(response);
  const data = root?.data;

  if (Array.isArray(data)) {
    return data;
  }

  const nested = asRecord(data);

  if (!nested) {
    return [];
  }

  for (const key of ["items", "results", "markets", "events", "rows"]) {
    const value = nested[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function extractEntity(response: unknown) {
  const root = asRecord(response);
  const data = root?.data;

  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  const nested = asRecord(data);

  if (!nested) {
    return data ?? null;
  }

  for (const key of ["market", "event", "item", "result"]) {
    if (nested[key] !== undefined) {
      return nested[key];
    }
  }

  return data ?? null;
}

function normalizeOutcomes(record: JsonRecord): MarketOutcome[] {
  const tokenRecords = readArray(record, ["tokens", "market_outcomes", "positions"])
    .map((entry) => asRecord(entry))
    .filter((entry): entry is JsonRecord => entry !== null)
    .map((entry, index) => {
      const label =
        readString(entry, ["label", "name", "outcome", "title"]) ??
        `Outcome ${index + 1}`;
      const probability = normalizePercent(
        readNumber(entry, ["probability", "prob", "price", "last_price"]),
      );

      return {
        label,
        probability,
      };
    });

  if (tokenRecords.length > 0) {
    return tokenRecords;
  }

  const labels = readArray(record, ["outcomes"]).filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
  );
  const prices = readArray(record, ["outcome_prices", "outcomePrices", "prices"]);

  return labels.map((label, index) => ({
    label,
    probability: normalizePercent(parseNumber(prices[index])),
  }));
}

function normalizeMarketRecord(input: unknown): MarketDetail | null {
  const record = asRecord(input);

  if (!record) {
    return null;
  }

  const slug = readString(record, ["slug"]);
  const title = readString(record, ["question", "title", "name"]);

  if (!slug || !title) {
    return null;
  }

  const conditionId = readString(record, ["condition_id", "id"]);

  return {
    id: conditionId ?? slug,
    slug,
    title,
    description: readString(record, [
      "description",
      "subtitle",
      "event_description",
      "summary",
    ]),
    probability: normalizePercent(
      readNumber(record, [
        "probability",
        "prob",
        "yes_price",
        "price",
        "last_price",
      ]),
    ),
    volume: readNumber(record, [
      "volume",
      "volume_usd",
      "total_volume",
      "liquidity",
    ]),
    endDate: readString(record, [
      "end_date",
      "endDate",
      "end_time",
      "close_time",
      "expiration",
    ]),
    eventTitle: readString(record, [
      "event_title",
      "event_name",
      "series_title",
    ]),
    conditionId,
    outcomes: normalizeOutcomes(record),
  };
}

export function normalizeMarketCollection(response: unknown): MarketSummary[] {
  return extractCollection(response)
    .map((entry) => normalizeMarketRecord(entry))
    .filter((market): market is MarketSummary => market !== null);
}

export function normalizeMarketEntity(response: unknown): MarketDetail | null {
  return normalizeMarketRecord(extractEntity(response));
}

