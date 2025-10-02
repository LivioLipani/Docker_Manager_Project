
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
        
    }
}

const chartManager = new ChartManager();
chartManager.init(); 
