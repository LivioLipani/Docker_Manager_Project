class SocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect() {
        const token = AuthManager.getToken();
        if (!token) return;

        this.socket = io({
            auth: {
                token: token
            }
        });

        this.socket.on('connect', () => {
            this.connected = true;
            console.log('Connected to Socket.IO server');
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
            console.log('Disconnected from Socket.IO server');
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            if (error.message === 'Authentication error') {
                AuthMan
                ager.logout();
            }
        });
        
        return this.socket;
    }
}

const socketManager = new SocketManager();