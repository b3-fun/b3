import DepositPageClient from "./deposit-page-client";
import { getPartnerConfig } from "./partner-config";

interface DepositPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DepositPage({ searchParams }: DepositPageProps) {
  const params = await searchParams;
  const partner = typeof params.partner === "string" ? params.partner : undefined;
  const partnerConfig = getPartnerConfig(partner);
  const redirectUrl = typeof params.redirect_url === "string" ? params.redirect_url : undefined;
  const redirectLabel = typeof params.redirect_label === "string" ? params.redirect_label : undefined;
  const amount = typeof params.amount === "string" ? params.amount : undefined;

  return (
    <DepositPageClient
      partnerConfig={partnerConfig}
      redirectUrl={redirectUrl}
      redirectLabel={redirectLabel}
      amount={amount}
    />
  );
}
