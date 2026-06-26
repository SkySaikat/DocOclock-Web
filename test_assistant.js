import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import fs from 'fs';

// Parse .env manually
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'] || '';
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAssistant() {
  console.log('Creating Test Assistant...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123456', salt);

  const permissions = {
    manage_queue: true,
    manage_appointments: true,
  };

  const { data, error } = await supabase.from('profiles').insert({
    full_name: 'Test Assistant',
    phone: '+8801999999999',
    password: hashedPassword,
    role: 'ASSISTANT',
    parent_id: 'efcafe7e-aa11-4822-a123-4b1aec2ad2ff',
    permissions: permissions,
    registration_status: 'approved'
  }).select();

  if (error) {
    console.error("Error creating assistant:", error.message);
    if (error.message.includes('parent_id') || error.message.includes('permissions')) {
      console.error("\nCRITICAL: You need to run the ADD_ASSISTANT_ROLE.sql script in your Supabase SQL Editor first!");
    }
  } else {
    console.log("Success! Test Assistant Created.");
    console.log("Login Phone: +8801999999999");
    console.log("Password: 123456");
  }
}

createAssistant();
