import { createClient } from '@supabase/supabase-js'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kxbrfjqxufvskcxmliak.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YnJmanF4dWZ2c2tjeG1saWFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2Nzg0NjYsImV4cCI6MjA4ODI1NDQ2Nn0.twnxJsGtpfTbXLTCOzIlGMpggXIuClZMZISIftp2btE'
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})
