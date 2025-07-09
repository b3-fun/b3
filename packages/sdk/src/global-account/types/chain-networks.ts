import { ObjectIdSchema, Static, Type } from "@feathersjs/typebox";

const ChainContractSchema = Type.Object({
  address: Type.String(),
  blockCreated: Type.Optional(Type.Integer()),
});

export const chainNetworksSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    id: Type.Integer(),
    name: Type.String(),
    rpcUrls: Type.Object({
      default: Type.Object({
        http: Type.String({ format: "uri" }),
        ws: Type.String({ format: "uri" }),
      }),
      backups: Type.Array(
        Type.Object({
          type: Type.Union([Type.Literal("http"), Type.Literal("ws")]),
          uri: Type.String(),
        }),
      ),
    }),
    icon: Type.Object({
      url: Type.String({ format: "uri" }),
      width: Type.Integer(),
      height: Type.Integer(),
      format: Type.String(),
    }),
    blockExplorers: Type.Object({
      explorerTitle: Type.String(),
      default: Type.String({ format: "uri" }),
    }),
    nativeCurrency: Type.Object({
      name: Type.String(),
      symbol: Type.String(),
      decimals: Type.Integer(),
    }),
    testnet: Type.Optional(Type.Boolean()),
    testnetConfigID: Type.Optional(Type.Integer()),
    // Additional required Viem fields that can't be derived
    sourceId: Type.Optional(Type.Integer()),
    contracts: Type.Optional(Type.Record(Type.String(), ChainContractSchema)),
    formatters: Type.Optional(Type.Record(Type.String(), Type.Any())),
    fees: Type.Optional(Type.Record(Type.String(), Type.Any())),
    badge: Type.Optional(Type.String({ format: "uri" })),
    color: Type.Optional(Type.String()),
    enabledFeatures: Type.Optional(Type.Array(Type.String())),
  },
  { $id: "ChainNetworks", additionalProperties: false },
);

export type ChainNetworks = Static<typeof chainNetworksSchema>;
