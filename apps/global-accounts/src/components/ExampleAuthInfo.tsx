import { useB3 } from "@b3dotfun/sdk/global-account/react";

export function ExampleAuthInfo() {
  const b3 = useB3();
  console.log("@@b3", b3);

  return (
    <div>
      <h2>Example Auth Info</h2>
    </div>
  );
}
