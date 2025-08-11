import { NextResponse } from 'next/server';

export async function GET() {
  // Return current server time in seconds (Unix timestamp)
  const currentTime = Math.floor(Date.now() / 1000);
  
  return NextResponse.json(currentTime);
} 