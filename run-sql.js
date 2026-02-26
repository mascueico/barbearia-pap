const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('database.db');

const sql = fs.readFileSync('adicionar_barbeiros.sql', 'utf8');

db.exec(sql, function(err) {
    if (err) {
        console.error(err.message);
    } else {
        console.log('SQL script executed successfully');
    }
    db.close();
});
