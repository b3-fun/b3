const url = "https://ens-gateway.b3.fun/";

export function getEnsName(name: string): Promise<Response> {
  return fetch(url + `get/${name}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export type B3NameResponse = {
  name: string;
};

export async function getB3NameByAddress(address: string): Promise<B3NameResponse | null> {
  try {
    const response = await fetch(url + `address/${address}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  } catch (error) {
    return null;
  }
}
