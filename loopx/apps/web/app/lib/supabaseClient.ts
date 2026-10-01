import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pnwmejximdernqmmirlf.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_12RcIRKLwXnX7iD-5at26Q_giy7kITg';

export const supabase = createClient(supabaseUrl, supabaseKey);
