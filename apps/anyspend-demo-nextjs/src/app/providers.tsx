"use client";

import { B3DynamicModal, B3Provider } from "@b3dotfun/sdk/global-account/react";
import { QueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <B3Provider theme="light" environment="development">
      {children}
      <B3DynamicModal />
    </B3Provider>
  );
}
