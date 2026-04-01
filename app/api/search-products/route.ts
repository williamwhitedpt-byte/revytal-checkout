import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/sheets';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') ?? '';

  if (!query.trim()) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await searchProducts(query);
    return NextResponse.json({ products });
  } catch (err: unknown) {
    console.error('[search-products]', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
