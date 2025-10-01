const jwt = require('jsonwebtoken');
const User = require('../query/user');

class SocketService{
    constructor(io) {
        this.io = io;
        this.authenticatedSockets = new Map();
        this.setupAuthentication();
        this.setupEventHandlers();
    }

    //middlware socketio
    setupAuthentication() {
        this.io.use(async (socket, next) => {
            try {
                //controlla se esiste un token
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }
                //verifica il token
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                const user = await User.findById(decoded.userId);

                if (!user) {
                    return next(new Error('Authentication error'));
                }

                socket.user = user;
                //salvo gli utenti connessi in una mappa chiave valore
                this.authenticatedSockets.set(socket.id, user);
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`User ${socket.user.username} connected via Socket.IO`);

            socket.on('disconnect', () => {
                console.log(`User ${socket.user.username} disconnected`);
                this.authenticatedSockets.delete(socket.id);
            });
        });
    }
}

module.exports = SocketService;