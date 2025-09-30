const pool = require('../database_config/db');
const bcrypt = require('bcrypt');

class User {
    static async getAll() {
        const query = 'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }

    static async findByUsername(username) {
        const query = 'SELECT * FROM users WHERE username = $1';
        const result = await pool.query(query, [username]);
        return result.rows[0];
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;