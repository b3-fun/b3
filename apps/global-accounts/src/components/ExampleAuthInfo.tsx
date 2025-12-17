import { useUser } from "@b3dotfun/sdk/global-account/react";

export function ExampleAuthInfo() {
  const { user } = useUser();
  console.log("@@user", user);

  return (
    <div>
      <h2>Example Auth Info</h2>
    </div>
  );
}
