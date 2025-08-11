import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '';
  const limit = parseInt(searchParams.get('limit') || '10');
  
  console.log(`Symbol search request: query="${query}", limit=${limit}`);
  
  // For now, return empty results since we're focusing on direct symbol resolution
  // In a real implementation, you would search your token database
  return NextResponse.json([]);
} 