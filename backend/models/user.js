const pool = require('../database_config/db');
const bcrypt = require('bcrypt');

class User {
    static async getAll() {
        const query = 'SELECT id, username, role, created_at FROM users ORDER BY created_at DESC';
        const result = await pool.query(query);
        return result.rows;
    }
}

module.exports = User;