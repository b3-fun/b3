import { Button, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { BankIcon } from "@b3dotfun/sdk/global-account/react/components/icons/BankIcon";
import { SwapIcon } from "@b3dotfun/sdk/global-account/react/components/icons/SwapIcon";
import { cn } from "@b3dotfun/sdk/shared/utils";

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M17.9958 1.21467C17.666 1.10449 17.359 1.18417 17.2063 1.22851C17.04 1.27683 16.8417 1.35425 16.6428 1.43191L2.51187 6.94641C2.28951 7.03315 2.07413 7.11717 1.9079 7.19936C1.76427 7.27038 1.45899 7.42845 1.28859 7.75646C1.10067 8.11818 1.10092 8.54881 1.28927 8.9103C1.46006 9.23811 1.76552 9.39582 1.90924 9.46667C2.07556 9.54867 2.29099 9.63241 2.51345 9.71889L6.4468 11.2485C6.74023 11.3626 6.88695 11.4197 7.03291 11.4232C7.16193 11.4263 7.2899 11.3994 7.40674 11.3446C7.53893 11.2826 7.65024 11.1713 7.87287 10.9487L11.9107 6.91083C12.2361 6.58539 12.7638 6.58539 13.0892 6.91083C13.4147 7.23626 13.4147 7.7639 13.0892 8.08934L9.05138 12.1272C8.82875 12.3498 8.71744 12.4611 8.65545 12.5933C8.60065 12.7101 8.57374 12.8381 8.57684 12.9671C8.58035 13.1131 8.6374 13.2598 8.75152 13.5532L10.2811 17.4865C10.3676 17.709 10.4514 17.9245 10.5334 18.0908C10.6042 18.2345 10.7619 18.54 11.0897 18.7108C11.4512 18.8991 11.8819 18.8994 12.2436 18.7115C12.5716 18.541 12.7297 18.2358 12.8007 18.0921C12.8829 17.9259 12.9669 17.7106 13.0536 17.4882L18.5681 3.35726C18.6458 3.15833 18.7232 2.96007 18.7715 2.79371C18.8159 2.64105 18.8955 2.334 18.7854 2.00419C18.6609 1.63157 18.3685 1.33915 17.9958 1.21467Z"
      fill="#0C68E9"
    />
  </svg>
);

const BuyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path
      d="M9.99998 8.75C9.30962 8.75 8.74998 9.30964 8.74998 10C8.74998 10.6904 9.30962 11.25 9.99998 11.25C10.6903 11.25 11.25 10.6904 11.25 10C11.25 9.30964 10.6903 8.75 9.99998 8.75Z"
      fill="#0C68E9"
    />
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M14.1666 2.5C12.3642 2.5 10.8013 2.95205 9.44241 3.37018L9.18862 3.44844C7.90485 3.84476 6.86213 4.16667 5.83332 4.16667C5.09512 4.16667 4.43564 4.08819 3.88041 3.98151L3.85421 3.97647C3.44746 3.89831 3.10585 3.83267 2.84038 3.79758C2.60748 3.76679 2.26236 3.7302 1.94675 3.84126C1.78134 3.89947 1.60242 3.98249 1.43327 4.12224C1.26411 4.26199 1.14882 4.42202 1.06045 4.57348C0.898119 4.85168 0.864329 5.167 0.849347 5.3925C0.833297 5.63407 0.833306 5.94132 0.833317 6.29588L0.833315 15.2922C0.833263 15.4565 0.833201 15.6516 0.932434 15.9263C0.981719 16.0628 1.06288 16.1945 1.10974 16.2664C1.15659 16.3383 1.24436 16.4657 1.34932 16.5659C1.41718 16.6306 1.49456 16.6992 1.58722 16.76C1.67809 16.8196 1.76087 16.8559 1.79699 16.8717L1.80356 16.8746C2.48669 17.1759 3.71203 17.5 5.83332 17.5C7.63579 17.5 9.19862 17.0479 10.5576 16.6298L10.8113 16.5516C12.0951 16.1552 13.1378 15.8333 14.1666 15.8333C14.9048 15.8333 15.5643 15.9118 16.1196 16.0185L16.1458 16.0235C16.5525 16.1017 16.8941 16.1673 17.1596 16.2024C17.3925 16.2332 17.7376 16.2698 18.0532 16.1587C18.2186 16.1005 18.3975 16.0175 18.5667 15.8778C18.7359 15.738 18.8511 15.578 18.9395 15.4265C19.1018 15.1483 19.1356 14.833 19.1506 14.6075C19.1667 14.3659 19.1667 14.0587 19.1666 13.7041L19.1667 4.70776C19.1667 4.54347 19.1668 4.34839 19.0675 4.07365C19.0182 3.9372 18.9371 3.80547 18.8902 3.73359C18.8434 3.6617 18.7556 3.53428 18.6507 3.43412C18.5828 3.36935 18.5054 3.30084 18.4127 3.24003C18.3219 3.1804 18.2391 3.14413 18.203 3.1283L18.1964 3.12542C17.5133 2.82409 16.2879 2.5 14.1666 2.5ZM15.8333 7.5C15.8333 7.03976 15.4602 6.66667 15 6.66667C14.5397 6.66667 14.1666 7.03976 14.1666 7.5V10.8333C14.1666 11.2936 14.5397 11.6667 15 11.6667C15.4602 11.6667 15.8333 11.2936 15.8333 10.8333V7.5ZM7.08331 10C7.08331 8.38917 8.38915 7.08333 9.99998 7.08333C11.6108 7.08333 12.9166 8.38917 12.9166 10C12.9166 11.6108 11.6108 12.9167 9.99998 12.9167C8.38915 12.9167 7.08331 11.6108 7.08331 10ZM4.99998 8.33333C5.46022 8.33333 5.83331 8.70643 5.83331 9.16667V12.5C5.83331 12.9602 5.46022 13.3333 4.99998 13.3333C4.53974 13.3333 4.16665 12.9602 4.16665 12.5V9.16667C4.16665 8.70643 4.53974 8.33333 4.99998 8.33333Z"
      fill="#0C68E9"
    />
  </svg>
);

const HomeActionButton = ({
  customClass,
  icon,
  label,
  onClick,
}: {
  customClass: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => {
  return (
    <Button
      className={cn(
        "border-b3-line hover:border-b3-primary-blue flex h-[84px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-[1.5px] bg-[#FAFAFA] shadow-[0_0_0_1px_rgba(10,13,18,0.18)_inset,0_-2px_0_0_rgba(10,13,18,0.05)_inset,0_1px_2px_0_rgba(10,13,18,0.05)] hover:bg-[#FAFAFA]",
        customClass,
      )}
      onClick={onClick}
    >
      {icon}
      <div className="text-b3-grey font-neue-montreal-semibold">{label}</div>
    </Button>
  );
};

const HomeActions = ({ showDeposit, showSwap }: { showDeposit: boolean; showSwap: boolean }) => {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  return (
    <div className="b3-modal-home-actions border-b3-line grid grid-cols-4 gap-3 border-b px-5 pb-6">
      {showDeposit && (
        <HomeActionButton
          customClass="manage-account-deposit"
          icon={<BankIcon size={24} className="text-b3-primary-blue shrink-0" />}
          label="Deposit"
          onClick={() => {
            setB3ModalOpen(true);
            setB3ModalContentType({
              type: "deposit",
              showBackButton: true,
            });
          }}
        />
      )}
      <HomeActionButton
        customClass="manage-account-send"
        icon={<SendIcon />}
        label="Send"
        onClick={() => {
          setB3ModalOpen(true);
          setB3ModalContentType({
            type: "send",
            showBackButton: true,
          });
        }}
      />
      {showSwap && (
        <HomeActionButton
          customClass="manage-account-swap"
          icon={<SwapIcon size={24} className="text-b3-primary-blue" />}
          label="Swap"
          onClick={() => {
            setB3ModalOpen(true);
            setB3ModalContentType({
              type: "anySpend",
              showBackButton: true,
            });
          }}
        />
      )}
      <HomeActionButton
        customClass="manage-account-buy "
        icon={<BuyIcon />}
        label="Buy"
        onClick={() => {
          setB3ModalOpen(true);
          setB3ModalContentType({
            type: "anySpend",
            defaultActiveTab: "fiat",
            showBackButton: true,
          });
        }}
      />
    </div>
  );
};

export default HomeActions;
