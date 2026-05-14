import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client (uses service role key)
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey)

export default supabaseServer
