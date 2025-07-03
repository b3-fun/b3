export function Background() {
  return (
    <div className="fixed inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem]">
      <div className="bg-b3-blue/20 absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full opacity-50 blur-[100px]" />
      <div className="absolute left-60 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400/20 opacity-50 blur-[100px]" />
      <div className="absolute bottom-0 left-0 right-96 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-500/20 opacity-50 blur-[100px]" />
    </div>
  );
}
