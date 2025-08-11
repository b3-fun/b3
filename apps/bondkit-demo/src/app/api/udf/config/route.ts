import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
    supports_group_request: false,
    supports_marks: false,
    supports_search: true,
    supports_timescale_marks: false,
    exchanges: [
      {
        value: 'Bondkit',
        name: 'Bondkit',
        desc: 'Bondkit Token Exchange'
      }
    ],
    symbols_types: [
      {
        name: 'crypto',
        value: 'crypto'
      }
    ],
    currency_codes: ['USD', 'ETH']
  };

  return NextResponse.json(config);
} 