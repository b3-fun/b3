"use client";

import {
  B3DynamicModal,
  B3Provider,
  useModalStore,
} from "@b3dotfun/sdk/global-account/react";
import "@b3dotfun/sdk/index.css";

export function B3ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <B3Provider
      theme="light"
      environment="production"
      automaticallySetFirstEoa={true}
    >
      <B3DynamicModalWrapper />
      {children}
    </B3Provider>
  );
}

export function B3DynamicModalWrapper() {
  const modalStore = useModalStore();
  const isOpen = modalStore.isOpen;

  if (!isOpen) return null;

  return <B3DynamicModal />;
}
