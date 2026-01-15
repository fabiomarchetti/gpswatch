require('dotenv').config();
const { Pool } = require('pg');

async function importData() {
  console.log('🚀 Starting import from VPS to Supabase...');

  // 1. Connection to VPS (via Tunnel)
  const vpsConfig = {
    host: 'localhost',
    port: 5433,
    user: 'gpsuser',
    password: 'GpsWatch2025',
    database: 'gpswatch',
  };
  const vpsPool = new Pool(vpsConfig);

  // 2. Connection to Supabase
  const supabasePool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // --- DEVICES ---
    console.log('📡 Fetching DEVICES from VPS...');
    const resDevices = await vpsPool.query('SELECT * FROM devices ORDER BY id');
    const devices = resDevices.rows;
    console.log(`✅ Found ${devices.length} devices.`);

    console.log('💾 Importing DEVICES to Supabase...');
    for (const device of devices) {
      // Build insert query dynamically or explicitly
      // We want to preserve 'id'
      const keys = Object.keys(device);
      const values = Object.values(device);
      
      const columns = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      
      const query = `
        INSERT INTO devices (${columns}) 
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET
          imei = EXCLUDED.imei,
          device_id = EXCLUDED.device_id,
          phone_number = EXCLUDED.phone_number,
          updated_at = EXCLUDED.updated_at
      `;
      
      await supabasePool.query(query, values);
    }
    console.log('✅ Devices imported successfully.');

    // --- PATIENTS (linktop_pazienti -> wearers) ---
    console.log('👤 Fetching PATIENTS (linktop_pazienti) from VPS...');
    const resPatients = await vpsPool.query('SELECT * FROM linktop_pazienti ORDER BY id');
    const patients = resPatients.rows;
    console.log(`✅ Found ${patients.length} patients.`);

    console.log('💾 Importing PATIENTS to Supabase (table: wearers)...');
    for (const p of patients) {
      // Map columns
      // linktop_pazienti has almost same columns as wearers, but check carefully
      const wearer = {
        id: p.id,
        nome: p.nome,
        cognome: p.cognome,
        data_nascita: p.data_nascita,
        luogo_nascita: p.luogo_nascita,
        codice_fiscale: p.codice_fiscale,
        sesso: p.sesso,
        indirizzo: p.indirizzo,
        citta: p.citta,
        provincia: p.provincia,
        cap: p.cap,
        telefono: p.telefono,
        email: p.email,
        emergenza_nome: p.emergenza_nome,
        emergenza_telefono: p.emergenza_telefono,
        emergenza_relazione: p.emergenza_relazione,
        emergenza2_nome: p.emergenza2_nome,
        emergenza2_telefono: p.emergenza2_telefono,
        emergenza2_relazione: p.emergenza2_relazione,
        gruppo_sanguigno: p.gruppo_sanguigno,
        allergie: p.allergie,
        patologie: p.patologie,
        farmaci: p.farmaci,
        note_mediche: p.note_mediche,
        device_id: p.device_id,
        device_assigned_date: p.device_assigned_date,
        foto_url: p.foto_url,
        active: p.active,
        created_at: p.created_at,
        updated_at: p.updated_at,
        created_by: p.created_by 
      };

      // We need to handle 'created_by' FK. If user doesn't exist in Supabase users, set NULL
      // For now, let's set created_by to NULL to avoid FK errors (unless we sync users too)
      wearer.created_by = null;

      const keys = Object.keys(wearer);
      const values = Object.values(wearer);
      const columns = keys.map(k => `"${k}"`).join(', ');
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

      const query = `
        INSERT INTO wearers (${columns}) 
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET
          nome = EXCLUDED.nome,
          cognome = EXCLUDED.cognome,
          device_id = EXCLUDED.device_id
      `;

      await supabasePool.query(query, values);
    }
    console.log('✅ Patients imported successfully.');

    // Update sequences to avoid collision on next insert
    console.log('🔄 Updating sequences...');
    await supabasePool.query("SELECT setval('devices_id_seq', (SELECT MAX(id) FROM devices))");
    await supabasePool.query("SELECT setval('wearers_id_seq', (SELECT MAX(id) FROM wearers))");
    
    console.log('🎉 Migration finished!');

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await vpsPool.end();
    await supabasePool.end();
  }
}

importData();
