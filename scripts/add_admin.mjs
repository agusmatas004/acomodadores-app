import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addAdmin() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'luisteseira@gmail.com',
    password: 'Este9183',
    email_confirm: true
  })
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success:', data.user.id)
  }
}

addAdmin()
