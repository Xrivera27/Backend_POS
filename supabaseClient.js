const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;  // Agrega la URL de tu proyecto Supabase a tu .env
const supabaseKey = process.env.SUPABASE_KEY;  // Agrega la API KEY de tu proyecto Supabase a tu .env

const supabaseClient = createClient(supabaseUrl, supabaseKey);

module.exports = { supabaseClient };