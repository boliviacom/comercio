const { createClient } = require('@supabase/supabase-js');

// Usamos las variables que ya cargamos en index.js
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;