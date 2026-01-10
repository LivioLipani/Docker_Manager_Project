class SocketManager {
    constructor() {
        this.socket = null;
        this.connected = false;

        this.isLogout= false;
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
            this.isLogout = false;
            this.connected = true;
            console.log('Connected to Socket.IO server');
        });

        this.socket.on('disconnect', () => {
            if(!this.isLogout) return;

            this.connected = false;
            console.log('Disconnected from Socket.IO server');

            document.getElementById('system-status').innerHTML = '<span class="text-red-500">Offline</span>';
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

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
            this.isLogout = true;
        }
    }

    emit(event, data) {
        if (this.socket && this.connected) {
            this.socket.emit(event, data);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }
}

const socketManager = new SocketManager();