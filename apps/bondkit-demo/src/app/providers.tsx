"use client";

import { B3DynamicModal, B3Provider, StyleRoot } from "@b3dotfun/sdk/global-account/react";
import "@b3dotfun/sdk/index.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <B3Provider environment="production" theme="light" automaticallySetFirstEoa={true}>
      <B3DynamicModal />
      <StyleRoot>{children}</StyleRoot>
    </B3Provider>
  );
}
