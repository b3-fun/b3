import { StaticHttpClient } from "../client";
import type { CheckoutSession, QuickPayParams } from "../types";

const DEFAULT_BASE_URL = "https://platform-api.anyspend.com/api/v1";

export class QuickPayResource {
  static async create(params: QuickPayParams, baseUrl?: string): Promise<CheckoutSession> {
    return StaticHttpClient.post<CheckoutSession>(baseUrl || DEFAULT_BASE_URL, "/quick-pay", params as any);
  }
}
