import { describe, it, expect } from "vitest";
import { gasService, isGasOracleSupported } from "./gas";

describe("gasService", () => {
  it("should check supported chains", () => {
    expect(isGasOracleSupported(8453)).toBe(true); // Base
    expect(isGasOracleSupported(1)).toBe(true); // Ethereum
    expect(isGasOracleSupported(999999)).toBe(false); // Unknown
  });

  it("should fetch gas price for Base", async () => {
    const gas = await gasService.fetch(8453);

    console.log("Gas data:", gas);

    expect(gas.chainId).toBe(8453);
    expect(gas.chainName).toBe("Base");
    expect(gas.level).toMatch(/low|normal|elevated|high|spike/);
    expect(typeof gas.gasPriceGwei).toBe("string");
    expect(typeof gas.isSpike).toBe("boolean");
  });

  it("should fetch gas price for Ethereum", async () => {
    const gas = await gasService.fetch(1);

    console.log("ETH Gas:", gas);

    expect(gas.chainId).toBe(1);
    expect(gas.source).toBe("blocknative"); // ETH uses Blocknative
  });
});
