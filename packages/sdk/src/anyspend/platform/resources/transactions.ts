import type { HttpClient } from "../client";
import { autoPaginate } from "../utils/pagination";
import type { Transaction, TransactionStats, ListResponse, ListTransactionsParams } from "../types";

export interface ExportTransactionsParams {
  format?: "csv" | "json";
  status?: string;
  from?: number;
  to?: number;
}

export class TransactionsResource {
  constructor(private client: HttpClient) {}

  async list(params?: ListTransactionsParams): Promise<ListResponse<Transaction>> {
    return this.client.get<ListResponse<Transaction>>("/transactions", params as any);
  }

  async *listAutoPaginate(params?: Omit<ListTransactionsParams, "page">) {
    yield* autoPaginate<Transaction>((page, limit) => this.list({ ...params, page, limit }), { limit: params?.limit });
  }

  async get(id: string): Promise<Transaction> {
    return this.client.get<Transaction>(`/transactions/${id}`);
  }

  async stats(): Promise<TransactionStats> {
    return this.client.get<TransactionStats>("/transactions/stats");
  }

  async export(params?: ExportTransactionsParams): Promise<string> {
    return this.client.get<string>("/transactions/export", params as any);
  }
}
