const pool = require('../database_config/db');
const bcrypt = require('bcrypt');

class User {
    static async create(username, password, role) {
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const query = `
        INSERT INTO users (username, password_hash, role)
        VALUES ($1, $2, $3)
        RETURNING id, username, role, created_at
        `;

        const result = await pool.query(query, [username, passwordHash, role]);
        return result.rows[0];
    }

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

    static async findById(id) {
        const query = 'SELECT id, username, role, created_at FROM users WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }
}

module.exports = User;