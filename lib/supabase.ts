
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qtzlvtssojplrylzhgyw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0emx2dHNzb2pwbHJ5bHpoZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MTkzMjIsImV4cCI6MjA3OTA5NTMyMn0.-ZuqnItoRiYE07EXQFJKybPghv0gigxuz0tnIVwrWHk'

export const supabase = createClient(supabaseUrl, supabaseKey)
