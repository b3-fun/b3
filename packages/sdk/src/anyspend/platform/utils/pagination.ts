/**
 * Auto-pagination async iterator for list endpoints.
 */

import type { ListResponse } from "../types";

export interface AutoPaginateOptions {
  startPage?: number;
  limit?: number;
}

/**
 * Creates an async iterator that automatically paginates through all results.
 */
export async function* autoPaginate<T>(
  fetchPage: (page: number, limit: number) => Promise<ListResponse<T>>,
  options: AutoPaginateOptions = {},
): AsyncGenerator<T, void, undefined> {
  let page = options.startPage || 1;
  const limit = options.limit || 100;

  while (true) {
    const result = await fetchPage(page, limit);

    for (const item of result.data) {
      yield item;
    }

    if (!result.has_more) break;
    page++;
  }
}
