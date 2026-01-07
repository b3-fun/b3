import { PropsWithChildren } from "react";

export function StyleRoot({ children, id }: PropsWithChildren<{ id?: string }>) {
  return (
    <div className="b3-root" id={id}>
      {children}
    </div>
  );
}
