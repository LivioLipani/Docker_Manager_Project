function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

class ChartManager{

    constructor() {
        this.socket = null;
        this.containerStatusChart = null;
        this.systemResourcesChart =  null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.socket = socketManager.socket;
        this.initCharts();
        this.bindSocketEvents();
        this.loadInitialData();
        this.initialized = true;
    }

    initCharts() {
        const containerCtx = document.getElementById('container-status-chart').getContext('2d');
        this.containerStatusChart = new Chart(containerCtx, {
            type: 'doughnut',
            data: {
                labels: ['Running', 'Stopped', 'Paused', 'Exited'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#10B981', '#EF4444', '#F59E0B', '#6B7280'],
                    borderWidth: 0
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#9CA3AF',
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });

        const systemCtx = document.getElementById('system-resources-chart').getContext('2d');
        this.systemResourcesChart = new Chart(systemCtx, {
            type: 'bar',
            data: {
                labels: ['CPU Usage', 'Memory Usage', 'Network I/O'],
                datasets: [{
                    label: 'Container Resources %',
                    data: [0, 0, 0],
                    backgroundColor: ['#3B82F6', '#8B5CF6', '#06B6D4'],
                    borderRadius: 4,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: '#9CA3AF',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: '#374151'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9CA3AF',
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: '#374151'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    updateInfo(stats){
        const statusElement = document.getElementById('system-status');

        if (stats.online === false) {
            if (statusElement) {
                statusElement.innerHTML =`<span class="flex items-center text-red-500 gap-2">
                                                <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                                Offline
                                          </span>`;
            }
            
            document.getElementById('running-containers').textContent = '-';
            document.getElementById('resource-info').textContent = 'Docker daemon not reachable';
            return; 
        }

        statusElement.innerHTML = `<span class="flex items-center text-green-500 gap-2">
                                        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        Online
                                    </span>`;

        const statusCounts = {
            running: stats.containers.running,
            stopped: stats.containers.total - stats.containers.running,
            paused: 0,
            exited: 0
        };

        document.getElementById('running-containers').textContent = stats.containers.running;
        document.getElementById('total-images').textContent = stats.images;
        document.getElementById('total-volumes').textContent = stats.volumes;

        const netEl = document.getElementById('total-networks');
        if (netEl) netEl.textContent = stats.networks || 0;

        if (this.containerStatusChart) {
            this.containerStatusChart.data.datasets[0].data = [
                statusCounts.running,
                statusCounts.stopped,
                statusCounts.paused,
                statusCounts.exited
            ];
            this.containerStatusChart.update('none');
        }

        if (this.systemResourcesChart && stats.resources) {
            const cpuUsage = stats.resources.cpu_percent || 0;
            const memoryUsage = stats.resources.memory_percent || 0;
            const networkUsage = stats.resources.container_count > 0 ?
                Math.min(((stats.resources.network_rx + stats.resources.network_tx) / (1024 * 1024 * 100)) * 100, 100) : 0;

            this.systemResourcesChart.data.labels = ['CPU Usage', 'Memory Usage', 'Network I/O'];
            this.systemResourcesChart.data.datasets[0].data = [
                Math.round(cpuUsage * 100) / 100,
                Math.round(memoryUsage * 100) / 100,
                Math.round(networkUsage * 100) / 100
            ];
            this.systemResourcesChart.update('none');

            const resourceInfo = document.getElementById('resource-info');
            if (resourceInfo && stats.resources.container_count > 0) {
                const memoryUsageFormatted = formatBytes(stats.resources.memory_usage);
                const memoryLimitFormatted = formatBytes(stats.resources.memory_limit);
                const networkRxFormatted = formatBytes(stats.resources.network_rx);
                const networkTxFormatted = formatBytes(stats.resources.network_tx);

                resourceInfo.innerHTML = `
                    ${stats.resources.container_count} running containers |
                    Memory: ${memoryUsageFormatted} / ${memoryLimitFormatted} |
                    Network: ↓${networkRxFormatted} ↑${networkTxFormatted}
                `;
            } else if (resourceInfo) {
                resourceInfo.textContent = 'No running containers to monitor';
            }
        }
    }

    bindSocketEvents() {
        this.socket.on('update_system_stats', (stats) => {
            this.updateInfo(stats);
        });

        this.socket.on('disconnect', () => {
            if(!socketManager.isLogout){
                return;
            }

            const el = document.getElementById('system-status');
            if(el) el.innerHTML = `<span class="flex items-center text-yellow-500 gap-2">
                                        <span class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                                        Connecting...
                                    </span>`;
        });

        this.socket.on('system_stats_error', (error) => {
            console.error('System stats error:', error);
            document.getElementById('system-status').innerHTML = '<span class="text-red-500">Error</span>';
        });

        this.socket.on('connect', () => {
            if(!this.isLogout){
                this.socket.emit('subscribe_system_stats');
            }
        });

        if (this.socket.connected) {
             this.socket.emit('subscribe_system_stats');
        }
    }

    async loadInitialData() {
        try {
            const [containers, images, volumes, networks] = await Promise.all([
                apiManager.get('/api/containers'),
                apiManager.get('/api/images'),
                apiManager.get('/api/volumes'),
                apiManager.get('/api/networks')
            ]);

            const runningContainers = containers.filter(c => c.state === 'running').length;

            const initialStats = {
                online: true,
                containers: {
                    running: runningContainers,
                    total: containers.length
                },
                images: images.length,
                volumes: volumes.length,
                networks: networks ? networks.length : 0,
            
                resources: {
                    cpu_percent: 0,
                    memory_percent: 0,
                    memory_usage: 0,
                    memory_limit: 0,
                    network_rx: 0,
                    network_tx: 0,
                    container_count: runningContainers
                }
            };

            this.updateInfo(initialStats);
        } catch (error) {
            console.error('Failed to load initial data:', error);
        }
    }
}

const chartManager = new ChartManager();

