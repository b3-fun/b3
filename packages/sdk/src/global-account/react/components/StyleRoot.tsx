import { PropsWithChildren } from "react";
import { useB3 } from "./B3Provider/useB3";

export function StyleRoot({ children, id }: PropsWithChildren<{ id?: string }>) {
  const { theme } = useB3();

  return (
    <div className="b3-root" id={id} data-theme={theme}>
      {children}
    </div>
  );
}
