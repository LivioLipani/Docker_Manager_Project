require('dotenv').config({
    path: '.env',
    debugg: true
});

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const authRoutes = require('./backend/routes/auth');
const userRoutes = require('./backend/routes/users');
const socketService = require('./backend/services/socketService');

const app = express()
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);

app.get('/health', (req, res) => {
    try {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
})

const socket = new socketService(io);

server.listen(PORT, () => {
    console.log(`Docker Manager Server running on port: ${PORT}`);
    console.log(`Health check:  http://localhost:${PORT}/health`);
});