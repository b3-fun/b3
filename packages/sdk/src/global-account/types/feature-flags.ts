import { ObjectIdSchema, Static, Type } from "@feathersjs/typebox";

export const featureFlagsSchema = Type.Object(
  {
    _id: ObjectIdSchema(),
    id: Type.String(),
    enabled: Type.Boolean(),
    description: Type.String(),
  },
  { $id: "FeatureFlags", additionalProperties: false },
);

export type FeatureFlags = Static<typeof featureFlagsSchema>;
