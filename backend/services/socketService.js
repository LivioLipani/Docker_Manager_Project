const DockerService = require('./dockerService');

const jwt = require('jsonwebtoken');
const User = require('../query/user');

class SocketService{
    constructor(io) {
        this.io = io;
        this.authenticatedSockets = new Map();
        this.statsIntervals = new Map();
        this.setupAuthentication();
        this.setupEventHandlers();
    }

    setupAuthentication(){
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }
                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                const user = await User.findById(decoded.userId);

                if (!user) {
                    return next(new Error('Authentication error'));
                }

                socket.user = user;
                this.authenticatedSockets.set(socket.id, user);
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });
    }

    setupEventHandlers(){
        this.io.on('connection', (socket) => {
            console.log(`User ${socket.user.username} connected via Socket`);

            socket.on('disconnect', () => {
                console.log(`User ${socket.user.username} disconnected`);
                this.authenticatedSockets.delete(socket.id);
                this.cleanupSocketSubscriptions(socket);
            });

            socket.on('subscribe_system_stats', () => {
                this.subscribeToSystemStats(socket);
            });

            socket.on('unsubscribe_system_stats', () => {
                console.log(`User ${socket.user.username} unsubscribed from stats`);
                this.unsubscribeFromSystemStats(socket);
            });
        });
    }

    subscribeToSystemStats(socket){
        const intervalKey = `${socket.id}_system`;

        if (this.statsIntervals.has(intervalKey)) {
            return;
        }

        this.emitStats(socket);

        const interval = setInterval(() => {
            this.emitStats(socket);
        }, 2000);

        this.statsIntervals.set(intervalKey, interval);
    }

    async emitStats(socket) {
        try {
            const isOnline = await DockerService.testConnection();
            
            if (!isOnline) {
                socket.emit('update_system_stats', {
                    online: false,
                    containers: { running: 0, total: 0 },
                    images: 0,
                    volumes: 0,
                    resources: null
                });
                return;
            }

            const [containers, images, volumes, networks, systemInfo] = await Promise.all([
                DockerService.getContainers(),
                DockerService.getImages(),
                DockerService.getVolumes(),
                DockerService.getNetworks(),
                DockerService.getSystemInfo()
            ]);

            const runningContainers = containers.filter(c => c.state === 'running');
            const totalContainers = containers.length;

            let totalCpuUsage = 0;
            let totalMemoryUsage = 0;
            let totalNetworkRx = 0;
            let totalNetworkTx = 0;
            let containerCount = 0;

            const containerStatsPromises = runningContainers.map(async (container) => {
                try {
                    const stats = await DockerService.getContainerStats(container.fullId);
                    return {
                        id: container.id,
                        name: container.name,
                        cpu_percent: stats.cpu_percent,
                        memory_usage: stats.memory_usage,
                        memory_limit: stats.memory_limit,
                        memory_percent: stats.memory_percent,
                        network_rx: stats.network_rx,
                        network_tx: stats.network_tx
                    };
                } catch (error) {
                    console.error(`Failed to get stats for container ${container.id}:`, error.message);
                    return null;
                }
            });

            const containerStats = (await Promise.all(containerStatsPromises)).filter(s => s !== null);

            containerStats.forEach(stats => {
                totalCpuUsage += stats.cpu_percent;
                totalMemoryUsage += stats.memory_usage;
                totalNetworkRx += stats.network_rx;
                totalNetworkTx += stats.network_tx;
                containerCount++;
            });

            const avgCpuUsage = containerCount > 0 ? totalCpuUsage / containerCount : 0;

            const systemTotalMem = systemInfo.MemTotal || 1; 
            const totalMemoryPercent = (totalMemoryUsage / systemTotalMem) * 100;

            const systemStats = {
                online: true,
                containers: {
                    running: runningContainers.length,
                    total: totalContainers
                },
                images: images.length,
                volumes: volumes.length,
                networks: networks.length,
                resources: {
                    cpu_percent: Math.round(avgCpuUsage * 100) / 100,
                    memory_usage: totalMemoryUsage,
                    memory_limit: systemTotalMem, 
                    memory_percent: Math.round(totalMemoryPercent * 100) / 100,
                    network_rx: totalNetworkRx,
                    network_tx: totalNetworkTx,
                    container_count: containerCount
                },
                containerStats: containerStats,
                system: {
                    memTotal: systemInfo.MemTotal,
                    cpus: systemInfo.NCPU,
                    kernelVersion: systemInfo.KernelVersion
                }
            };

            socket.emit('update_system_stats', systemStats);

        } catch (error) {
            console.error("Socket Loop Error:", error);
            socket.emit('system_stats_error', { error: error.message });
        }
    }

    unsubscribeFromSystemStats(socket) {
        const intervalKey = `${socket.id}_system`;
        const interval = this.statsIntervals.get(intervalKey);

        if (interval) {
            clearInterval(interval);
            this.statsIntervals.delete(intervalKey);
        }
    }

    cleanupSocketSubscriptions(socket) {
        const socketsToClean = [];
        for (const [key] of this.statsIntervals) {
            if (key.startsWith(socket.id)) {
                socketsToClean.push(key);
            }
        }

        socketsToClean.forEach(key => {
            const interval = this.statsIntervals.get(key);
            if (interval) {
                clearInterval(interval);
                this.statsIntervals.delete(key);
            }
        });
    }
}

module.exports = SocketService;