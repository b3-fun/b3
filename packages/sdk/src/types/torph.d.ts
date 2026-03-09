declare module "torph/react" {
  import type { JSX } from "react";
  export function TextMorph(props: { children: string; className?: string }): JSX.Element;
}
