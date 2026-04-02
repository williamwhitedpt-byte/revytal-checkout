import { google } from 'googleapis';

export interface Product {
  product_name: string;
  sku: string;
  supplier: string;
  price: number;
  cost: number;
  url: string;
  tags: string;
  image: string;        // NEW
  description: string;  // NEW
}

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not set');

  const creds = JSON.parse(raw);

  // Convert escaped newlines to real newlines
  creds.private_key = creds.private_key.replace(/\\n/g, '\n');

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    projectId: creds.project_id,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export async function searchProducts(query: string): Promise<Product[]> {
  const auth = getAuth();

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('GOOGLE_SHEET_ID not set');

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'products!A:I',
  });

  const rows = response.data.values ?? [];
  if (rows.length < 2) return [];

  const dataRows = rows.slice(1);
  const normalQuery = query.toLowerCase().trim();

  const products: Product[] = [];

  for (const row of dataRows) {
    const [
      product_name,
      sku,
      supplier,
      price,
      cost,
      url,
      tags,
      image,
      description
    ] = row;

    if (!sku) continue;

    const normalName = (product_name ?? '').toLowerCase().trim();
    const normalTags = (tags ?? '').toLowerCase().trim();
    const normalSku = (sku ?? '').toLowerCase().trim();

    const matches =
      normalName.includes(normalQuery) ||
      normalTags.includes(normalQuery) ||
      normalSku.includes(normalQuery);

    if (matches) {
      products.push({
        product_name: product_name ?? '',
        sku: sku ?? '',
        supplier: supplier ?? '',
        price: parseFloat(price) || 0,
        cost: parseFloat(cost) || 0,
        url: url ?? '',
        tags: tags ?? '',
        image: image ?? '',
        description: description ?? '',
      });
    }
  }

  return products;
}
