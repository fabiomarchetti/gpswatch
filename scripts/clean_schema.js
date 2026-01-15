const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../DB_VPS/gpswatch_schema.sql');
const cleanPath = path.join(__dirname, '../DB_VPS/gpswatch_schema_clean.sql');

let sql = fs.readFileSync(schemaPath, 'utf8');

console.log('🧹 Cleaning SQL...');
// Remove binary markers
sql = sql.replace(/\\restrict.*/g, '');
sql = sql.replace(/\\unrestrict.*/g, '');

// Remove ownership lines completely
// Use multiline flag and anchors to match full lines
sql = sql.replace(/^ALTER .* OWNER TO gpsuser;$/gm, '');

// Remove SET lines that might be problematic
sql = sql.replace(/^SET default_tablespace = '';$/gm, '');
sql = sql.replace(/^SET default_table_access_method = heap;$/gm, '');

// Remove extra newlines created by replacements
sql = sql.replace(/\n\s*\n/g, '\n\n');

fs.writeFileSync(cleanPath, sql);
console.log('✅ Cleaned SQL saved to:', cleanPath);
