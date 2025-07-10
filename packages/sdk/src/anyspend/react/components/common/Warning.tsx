export function Warning({ text }: { text: string }) {
  return (
    <div className="bg-as-red/60 relative rounded border border-orange-400 px-4 py-3 text-white" role="alert">
      <div className="font-bold">{text}</div>
    </div>
  );
}
