import { PAYMENT_METHOD_ICONS } from "@b3dotfun/sdk/anyspend/constants";

export default function PaymentMethodIcons() {
  const paymentMethods = [
    { name: "Visa", src: PAYMENT_METHOD_ICONS.visa },
    { name: "Mastercard", src: PAYMENT_METHOD_ICONS.mastercard },
    { name: "Amex", src: PAYMENT_METHOD_ICONS.amex },
    { name: "Apple Pay", src: PAYMENT_METHOD_ICONS.applePay },
    { name: "Google Pay", src: PAYMENT_METHOD_ICONS.googlePay },
  ];

  return (
    <div className="mt-6 flex w-full flex-col items-center gap-3">
      <div className="text-as-primary/30 text-xs">Supported payment methods</div>
      <div className="flex items-center gap-3">
        {paymentMethods.map(method => (
          <img key={method.name} src={method.src} alt={method.name} className="h-6 opacity-70" />
        ))}
      </div>
    </div>
  );
}
