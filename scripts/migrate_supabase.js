require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const schemaPath = path.join(__dirname, "../DB_VPS/gpswatch_schema.sql");

async function migrate() {
  console.log("🚀 Starting migration to Supabase...");

  // Read SQL file
  let sql = fs.readFileSync(schemaPath, "utf8");

  // Clean SQL
  console.log("🧹 Cleaning SQL...");
  sql = sql.replace(/\\restrict.*/g, "");
  sql = sql.replace(/\\unrestrict.*/g, "");
  sql = sql.replace(/OWNER TO gpsuser;/g, "");
  sql = sql.replace(/SET default_tablespace = '';/g, "");
  sql = sql.replace(/SET default_table_access_method = heap;/g, "");

  // Connect to DB
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }, // Required for Supabase sometimes
  });

  try {
    const client = await pool.connect();
    console.log("✅ Connected to Supabase!");

    // Execute SQL
    // We might need to split statements or just run the whole thing if pg supports it.
    // pg's query method usually supports multiple statements.
    console.log("⚡ Executing schema...");
    await client.query(sql);

    console.log("🎉 Migration completed successfully!");
    client.release();
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
