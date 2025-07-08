import { GetQuoteResponse, OrderType, Token, Tournament } from "@b3dotfun/sdk/anyspend";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { formatDisplayNumber, formatTokenAmount } from "@b3dotfun/sdk/shared/utils/number";
import { AnimatePresence } from "framer-motion";
import { AnySpendCustom } from "./AnySpendCustom";

type AnySpendTournamentProps =
  | {
      isMainnet?: boolean;
      mode?: "modal" | "page";
      action: "join";
      joinFor: string;
      loadOrder?: string;
      tournamentChainId: number;
      tournamentContractAddress: string;
      tournamentMetadata: Tournament;
      tournamentEntryToken: Token;
      tournamentEntryFee: string;
      onSuccess?: () => void;
    }
  | {
      isMainnet?: boolean;
      mode?: "modal" | "page";
      action: "fund";
      loadOrder?: string;
      tournamentChainId: number;
      tournamentContractAddress: string;
      tournamentMetadata: Tournament;
      tournamentFundToken: Token;
      tournamentFundAmount: string;
      onSuccess?: () => void;
    };

export function AnySpendTournament(props: AnySpendTournamentProps) {
  const {
    isMainnet = true,
    mode = "modal",
    action,
    loadOrder,
    tournamentChainId,
    tournamentContractAddress,
    tournamentMetadata,
    onSuccess
  } = props;

  const dstToken = action === "join" ? props.tournamentEntryToken : props.tournamentFundToken;
  const dstAmount = action === "join" ? props.tournamentEntryFee : props.tournamentFundAmount;

  const header = ({
    anyspendPrice,
    isLoadingAnyspendPrice
  }: {
    anyspendPrice: GetQuoteResponse | undefined;
    isLoadingAnyspendPrice: boolean;
  }) => (
    <>
      <div className="z-10 mt-[-100px] flex h-[270px] w-full items-end justify-center">
        <img
          src="https://cdn.b3.fun/tournament-play.svg"
          alt="Tournament Play"
          className="h-[200px] w-[360px] object-cover object-center"
        />
      </div>
      <div className="from-b3-react-background to-as-on-surface-1 mt-[-100px] w-full rounded-t-lg bg-gradient-to-t">
        <div className="h-[100px] w-full" />
        <div className="flex w-full flex-col items-center gap-1 p-6 pt-0">
          <span className="font-sf-rounded text-center text-lg font-semibold">
            {action === "join" ? "Pay entry fee to join " : "Pay to fund "} {tournamentMetadata.name}
          </span>
          <div className="mt-2 flex w-fit items-center gap-1">
            {anyspendPrice ? (
              <AnimatePresence mode="wait">
                <div
                  className={cn("text-as-primary group flex items-center text-2xl font-semibold transition-all", {
                    "opacity-0": isLoadingAnyspendPrice
                  })}
                >
                  {formatDisplayNumber(anyspendPrice?.data?.currencyIn?.amountUsd, { style: "currency" })} (
                  {formatTokenAmount(BigInt(dstAmount), dstToken.decimals, 6, true)} {dstToken.symbol})
                </div>
              </AnimatePresence>
            ) : (
              <div className="h-[32px] w-full" />
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <AnySpendCustom
      isMainnet={isMainnet}
      loadOrder={loadOrder}
      mode={mode}
      recipientAddress={action === "join" ? props.joinFor : undefined}
      orderType={action === "join" ? OrderType.JoinTournament : OrderType.FundTournament}
      dstChainId={tournamentChainId}
      dstToken={dstToken}
      dstAmount={dstAmount}
      contractAddress={tournamentContractAddress}
      encodedData="0x"
      metadata={{
        type: action === "join" ? OrderType.JoinTournament : OrderType.FundTournament,
        tournament: tournamentMetadata
      }}
      header={header}
      onSuccess={onSuccess}
      showRecipient={action === "join"}
    />
  );
}
