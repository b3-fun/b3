export function Warning({ text }: { text: string }) {
  return (
    <div className="relative rounded border border-orange-400 bg-as-red/60 px-4 py-3 text-white" role="alert">
      <div className="font-bold">{text}</div>
    </div>
  );
}
