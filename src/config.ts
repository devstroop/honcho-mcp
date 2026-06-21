import { Honcho } from "@honcho-ai/sdk";

export interface HonchoConfig {
  apiKey: string;
  baseUrl: string;
  workspaceId: string;
}

export function parseConfig(): HonchoConfig {
  return {
    apiKey: process.env.HONCHO_API_KEY?.trim() || "",
    baseUrl:
      process.env.HONCHO_API_URL?.trim() || "http://localhost:8000",
    workspaceId: process.env.HONCHO_WORKSPACE_ID?.trim() || "default",
  };
}

export function createClient(config: HonchoConfig): Honcho {
  return new Honcho({
    apiKey: config.apiKey,
    baseURL: config.baseUrl,
    workspaceId: config.workspaceId,
  });
}
