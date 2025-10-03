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
const containerRoutes = require('./backend/routes/containers');
const imageRoutes = require('./backend/routes/images');
const volumeRoutes = require('./backend/routes/volumes');

const socketService = require('./backend/services/socketService');
const dockerService = require('./backend/services/dockerService');


const app = express()
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/volumes', volumeRoutes);

app.get('/health', async (req, res) => {
    try {
        const dockerConnected = await dockerService.testConnection();
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            docker: dockerConnected ? 'Connected' : 'Disconnected'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            docker: 'Error',
            error: error.message
        });
    }
})

const socket = new socketService(io);

server.listen(PORT, async () => {
    console.log(`Docker Manager Server running on port: ${PORT}`);
    console.log(`Health check:  http://localhost:${PORT}/health`);

    const dockerConnected = await dockerService.testConnection();
    console.log(`Docker: ${dockerConnected ? 'Connected' : 'Disconnected'}`);
});