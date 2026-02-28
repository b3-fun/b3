import type { HttpClient } from "../client";
import type { AnalyticsOverview } from "../types";

export class AnalyticsResource {
  constructor(private client: HttpClient) {}

  async overview(period?: "7d" | "30d" | "90d" | "all"): Promise<AnalyticsOverview> {
    return this.client.get<AnalyticsOverview>("/analytics/overview", period !== undefined ? { period } : undefined);
  }
}
