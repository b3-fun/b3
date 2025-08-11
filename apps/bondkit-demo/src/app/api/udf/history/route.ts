import { Candle } from "@/types";
import { DEFAULT_API_ENDPOINT_BONDKIT } from "@/types/constants";
import Big from "big.js";
import { NextResponse, type NextRequest } from "next/server";

function getValidResolution(resolution: string): string {
  // Allowed values for the backend API
  const allowedResolutions = ["1", "5", "15", "30", "60", "1D", "1W", "1M"];

  // Aliases from TradingView to our allowed format
  const aliasMap: { [key: string]: string } = {
    D: "1D",
    W: "1W",
    M: "1M",
  };

  const mappedResolution = aliasMap[resolution] || resolution;

  if (allowedResolutions.includes(mappedResolution)) {
    return mappedResolution;
  }

  // Default to "1D" if the resolution is not in the allowed list.
  console.warn(
    `Unrecognized or unsupported resolution "${resolution}", defaulting to "1D".`
  );
  return "1D";
}

// Function to fetch real OHLCV data from the service
async function fetchRealOHLCVData(
  contractAddress: string,
  chainId: number,
  resolution: string,
  from: number,
  to: number,
  limit?: number
) {
  try {
    console.log(`Calling real service with:`, {
      contractAddress,
      chainId,
      resolution,
      from,
      to,
      limit,
    });

    const response = await fetch(DEFAULT_API_ENDPOINT_BONDKIT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-service-method": "getOHLCVData",
      },
      body: JSON.stringify({
        contractAddress,
        chainId,
        resolution: resolution,
        from: from, // Keep timestamps as-is for now
        to: to,
        limit: limit || 100,
      }),
    });

    if (!response.ok) {
      console.error(`Service responded with status: ${response.status}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Service response:`, data);

    data.candles = data.candles.map((c: Candle) => ({
      ...c,
      open: Big(c.open)
        .div(10 ** 18)
        .toFixed(),
      high: Big(c.high)
        .div(10 ** 18)
        .toFixed(),
      low: Big(c.low)
        .div(10 ** 18)
        .toFixed(),
      close: Big(c.close)
        .div(10 ** 18)
        .toFixed(),
      volume: Big(c.volume)
        .div(10 ** 18)
        .toFixed(),
    }));
    return data;
  } catch (error) {
    console.error("Error fetching real OHLCV data:", error);
    throw error;
  }
}

// TradingView UDF GET endpoint
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const from = parseInt(searchParams.get("from") || "0");
  const to = parseInt(searchParams.get("to") || "0");
  const resolution = searchParams.get("resolution") || "1D";
  const validResolution = getValidResolution(resolution);

  console.log(`=== TradingView History Request ===`);
  console.log(`URL: ${request.url}`);
  console.log(`Symbol: ${symbol}`);
  console.log(`From: ${from} (${new Date(from * 1000).toISOString()})`);
  console.log(`To: ${to} (${new Date(to * 1000).toISOString()})`);
  console.log(`Resolution: ${resolution} -> ${validResolution}`);

  // Extract contract address from symbol if it contains one
  // Format expected: SYMBOL-0x1234...5678
  const [displaySymbol, contractAddress] = (symbol || "").split("-");
  console.log(
    `Parsed symbol: displaySymbol=${displaySymbol}, contractAddress=${contractAddress}`
  );

  if (!symbol || !from || !to) {
    console.log("Missing required parameters");
    return NextResponse.json({ s: "error", errmsg: "Invalid parameters" });
  }

  if (!contractAddress) {
    console.log("No contract address found in symbol");
    return NextResponse.json({
      s: "error",
      errmsg: "Contract address not found in symbol",
    });
  }

  try {
    // Your trade timestamp is 1752161743000 (milliseconds)
    // TradingView sends from/to in seconds, so we need to convert to milliseconds for your service

    console.log(`Converting timestamps: from=${from}, to=${to}`);

    // Fetch real data from the service
    const data = await fetchRealOHLCVData(
      contractAddress,
      8453, // Default to Base chain
      validResolution,
      from,
      to
    );

    // console.log(`Raw service response:`, JSON.stringify(data, null, 2));

    if (!data.candles || data.candles.length === 0) {
      console.log("No candles found in response");
      return NextResponse.json({ s: "no_data" });
    }

    console.log(`Found ${data.candles.length} candles`);
    console.log("First candle:", data.candles[0]);
    console.log("Last candle:", data.candles[data.candles.length - 1]);

    // Convert to TradingView format - ensure timestamps are in seconds
    const tradingViewResponse = {
      s: "ok",
      t: data.candles.map((c: Candle) => Math.floor(c.timestamp / 1000)), // Convert to seconds
      o: data.candles.map((c: Candle) => c.open),
      h: data.candles.map((c: Candle) => c.high),
      l: data.candles.map((c: Candle) => c.low),
      c: data.candles.map((c: Candle) => c.close),
      v: data.candles.map((c: Candle) => c.volume),
    };

    console.log(`TradingView response:`, JSON.stringify(tradingViewResponse));
    return NextResponse.json(tradingViewResponse);
  } catch (error) {
    console.error("Error in TradingView history endpoint:", error);
    return NextResponse.json({ s: "error", errmsg: "Failed to fetch history" });
  }
}
