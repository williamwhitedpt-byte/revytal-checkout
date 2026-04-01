import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export type OrderStatus = 'pending' | 'paid' | 'sent_to_supplier';

export interface Order {
  id?: string;
  product_name: string;
  sku: string;
  supplier: string;
  price: number;
  cost: number;
  // ❌ REMOVE margin — Supabase generates it automatically
  checkout_url: string;
  qr_code_url?: string;
  patient_email?: string;
  patient_address?: string;
  status: OrderStatus;
  stripe_session_id?: string;
  created_at?: string;
}

export async function createOrder(order: {
  product_name: string;
  sku: string;
  supplier: string;
  price: number;
  cost: number;
  checkout_url: string;
  qr_code_url: string;
  status: OrderStatus;
  stripe_session_id: string;
}) {
  console.log("ORDER INSERT PAYLOAD:", order);

  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(
  stripeSessionId: string,
  status: OrderStatus,
  extra?: Partial<Order>,
) {
  const { error } = await supabase
    .from('orders')
    .update({ status, ...extra })
    .eq('stripe_session_id', stripeSessionId);

  if (error) throw error;
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Order[];
}
