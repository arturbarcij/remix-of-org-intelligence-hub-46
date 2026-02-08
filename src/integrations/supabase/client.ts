// This file provides a Supabase client using Lovable Cloud configuration
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Lovable Cloud project configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://kzbtmjqektdlqklnsqpd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6YnRtanFla3RkbHFrbG5zcXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NTA3OTQsImV4cCI6MjA4NjEyNjc5NH0.OgvbKhV9idLiJ4vBG3F8wokFagDyCzfD-ZtUZMUAoJk";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
