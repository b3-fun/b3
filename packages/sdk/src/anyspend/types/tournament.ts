import { z } from "zod";
import { zToken } from "./token";

export const zTournament = z.object({
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  imageUrl: z.string()
});
export type Tournament = z.infer<typeof zTournament>;

export const zJoinTournamentPayload = z.object({
  contractAddress: z.string(),
  entryPrice: z.string()
});

export const zFundTournamentPayload = z.object({
  contractAddress: z.string(),
  fundAmount: z.string()
});

export const zTournamentMetadata = z.object({
  srcToken: zToken,
  dstToken: zToken,
  tournament: zTournament
});
