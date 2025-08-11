import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol");
  const from = parseInt(searchParams.get("from") || "0");
  const to = parseInt(searchParams.get("to") || "0");

  if (!symbol || !from || !to) {
    return NextResponse.json({ s: "error", errmsg: "Invalid parameters" });
  }

  // In a real implementation, you would fetch marks from your database
  // For now, return empty arrays
  return NextResponse.json({
    id: [], // Array of mark IDs
    time: [], // Array of timestamps
    color: [], // Array of colors
    text: [], // Array of texts
    label: [], // Array of labels
    labelFontColor: [], // Array of label font colors
    minSize: [], // Array of minimum sizes
  });
}
