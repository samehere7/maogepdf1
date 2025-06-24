// Service role client for server-side operations
// This client has elevated permissions and can bypass RLS
import { createClient } from '@supabase/supabase-js'

// Create service role client for backend operations
export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)