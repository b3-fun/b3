import type { HttpClient } from "../client";
import type { Organization } from "../types";

export interface UpdateOrganizationParams {
  name?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  default_recipient_address?: string;
  default_chain_id?: number;
  default_token_address?: string;
}

export class OrganizationResource {
  constructor(private client: HttpClient) {}

  async get(): Promise<Organization> {
    return this.client.get<Organization>("/organization");
  }

  async update(params: UpdateOrganizationParams): Promise<Organization> {
    return this.client.patch<Organization>("/organization", params);
  }
}
