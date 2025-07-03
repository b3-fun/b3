import { useEffect, useState } from "react";
import { Dialog, DialogContent, Input, ShinyButton } from "@b3dotfun/sdk/global-account/react";

export function EnterRecipientModal({
  isOpenPasteRecipientAddress,
  setIsOpenPasteRecipientAddress,
  recipientAddress,
  setRecipientAddress
}: {
  isOpenPasteRecipientAddress: boolean;
  setIsOpenPasteRecipientAddress: (isOpen: boolean) => void;
  recipientAddress: string | undefined;
  setRecipientAddress: (address: string) => void;
}) {
  const [modalRecipientAddress, setModalRecipientAddress] = useState(recipientAddress || "");

  useEffect(() => {
    setModalRecipientAddress(recipientAddress || "");
  }, [recipientAddress]);

  return (
    <Dialog open={isOpenPasteRecipientAddress} onOpenChange={setIsOpenPasteRecipientAddress}>
      <DialogContent className="w-[420px] max-w-[calc(100vw-32px)] rounded-2xl p-3.5">
        <div className="flex flex-col gap-3">
          <div className="text-as-primary font-semibold">To address</div>
          <Input
            value={modalRecipientAddress}
            onChange={e => setModalRecipientAddress(e.target.value)}
            placeholder="Enter address"
            className="h-12 rounded-lg"
            spellCheck={false}
          />
          <ShinyButton
            accentColor={"hsl(var(--as-brand))"}
            textColor="text-white"
            className="w-full rounded-lg"
            onClick={() => {
              setIsOpenPasteRecipientAddress(false);
              setRecipientAddress(modalRecipientAddress);
            }}
          >
            Save
          </ShinyButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
