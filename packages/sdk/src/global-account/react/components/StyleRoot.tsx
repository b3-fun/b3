import { PropsWithChildren } from "react";
import { useB3Config } from "./B3Provider/useB3Config";

export function StyleRoot({ children, id }: PropsWithChildren<{ id?: string }>) {
  const { theme } = useB3Config();

  return (
    <div className="b3-root" id={id} data-theme={theme}>
      {children}
    </div>
  );
}
