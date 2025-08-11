import { DEFAULT_API_ENDPOINT_BONDKIT } from "@/types/constants";
import { NextResponse, type NextRequest } from "next/server";

// Function to fetch symbol information from the service
async function fetchSymbolInfo(contractAddress: string, chainId: number) {
  const response = await fetch(DEFAULT_API_ENDPOINT_BONDKIT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-service-method": "getTokenChartInfo",
    },
    body: JSON.stringify({
      // symbol: symbol,

      contractAddress,
      chainId,
    }),
  });

  if (!response.ok) {
    console.error(`Service responded with status: ${response.status}`);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json({
      s: "error",
      errmsg: "Symbol parameter is required",
    });
  }

  // Extract contract address from symbol if it contains one
  // Format expected: SYMBOL-0x1234...5678
  const [displaySymbol, contractAddress] = symbol.split("-");

  if (!contractAddress) {
    return NextResponse.json({ s: "error", errmsg: "Invalid symbol format" });
  }

  // Return symbol information
  const symbolInfo = {
    name: symbol,
    ticker: symbol,
    description: `${displaySymbol} Token`,
    type: "crypto",
    session: "24x7",
    timezone: "Etc/UTC",
    exchange: "Bondkit",
    minmov: 1,
    pricescale: 10000000000000, // 8 decimal places
    has_intraday: true,
    has_no_volume: false,
    has_weekly_and_monthly: true,
    supported_resolutions: ["1", "5", "15", "30", "60", "1D", "1W", "1M"],
    volume_precision: 2,
    data_status: "streaming",
    currency_code: "ETH",
  };

  try {
    const serverSymbolInfo = await fetchSymbolInfo(contractAddress, 8453);
    symbolInfo.pricescale = serverSymbolInfo.pricescale;
  } catch (error) {
    console.error("Error fetching symbol info:", error);
  }

  console.log(`Symbol resolution for ${symbol}:`, symbolInfo);
  return NextResponse.json(symbolInfo);
}
