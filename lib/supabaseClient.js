import { createClient } from '@supabase/supabase-js'

// ★ Dùng ĐÚNG cùng Project URL + anon key như web admin để 2 bên chia sẻ dữ liệu thật.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
