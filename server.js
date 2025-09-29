const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./backend/routes/auth');
const userRoutes = require('./backend/routes/users');

const app = express()
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

server.listen(PORT, () => {
  console.log(`Docker Manager Server running on port ${PORT}`);
});