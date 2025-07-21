export function SignatureMintButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-yellow-100 hover:shadow-md"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">Signature Mint</h3>
        <p className="mt-1 text-sm text-gray-500">Mint NFTs using signature-based minting</p>
      </div>
    </button>
  );
}
