"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { B3DynamicModal, B3Provider } from "@b3dotfun/sdk/global-account/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <B3Provider theme="light" environment="development">
        {children}
        <B3DynamicModal />
      </B3Provider>
    </QueryClientProvider>
  );
}
