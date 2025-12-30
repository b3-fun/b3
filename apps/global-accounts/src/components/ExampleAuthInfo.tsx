import { useUserQuery } from "@b3dotfun/sdk/global-account/react/hooks/useUserQuery";

export function ExampleAuthInfo() {
  const { user } = useUserQuery();
  console.log("@@user", user);

  return (
    <div>
      <h2>Example Auth Info</h2>
    </div>
  );
}
