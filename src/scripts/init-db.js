const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const schemaPath = path.join(__dirname, '../database/schema.sql');

async function initDatabase() {
    try {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Drop existing tables to ensure strict schema application
        await db.execute('DROP TABLE IF EXISTS messages');
        await db.execute('DROP TABLE IF EXISTS listings');
        await db.execute('DROP TABLE IF EXISTS categories');
        await db.execute('DROP TABLE IF EXISTS users');

        const queries = schemaSql
            .split(';')
            .map(query => query.trim())
            .filter(query => query.length > 0);

        console.log(`Toplam ${queries.length} sorgu çalıştırılacak...`);

        for (const query of queries) {
            await db.execute(query);
        }

        console.log('Veritabanı tabloları başarıyla oluşturuldu!');
        process.exit(0);
    } catch (error) {
        console.error('Veritabanı başlatma hatası:', error);
        process.exit(1);
    }
}

initDatabase();
