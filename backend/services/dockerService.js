const Docker = require('dockerode');

let docker;
try {
  // Try Docker Desktop on macOS/Windows
  docker = new Docker();
} catch (error) {
    try {
        // Fallback to socket path
        docker = new Docker({
        socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'
        });
    } catch (fallbackError) {
        console.error('Failed to connect to Docker:', fallbackError);
        docker = new Docker(); // Default connection as last resort
    }
}

class DockerService {
    static async testConnection() {
        try {
            await docker.ping();
            return true;
        } catch (error) {
            console.error('Docker connection failed:', error);
            return false;
        }
    }

    static async getContainers(all = true) {
        try {
        const containers = await docker.listContainers({ all });
        return containers.map(container => ({
            id: container.Id.substring(0, 12),
            fullId: container.Id,
            name: container.Names[0].replace('/', ''),
            image: container.Image,
            status: container.Status,
            state: container.State,
            ports: container.Ports,
            created: new Date(container.Created * 1000),
            labels: container.Labels
        }));
        } catch (error) {
            console.error('Failed to get containers:', error);
            throw error;
        }
    }

    static async getSystemInfo() {
        try {
            const info = await docker.info();
            return info;
        } catch (error) {
            console.error('Failed to get system info:', error);
            throw error;
        }
    }

    static async getImages() {
    try {
        const images = await docker.listImages();
        return images.map(image => ({
            id: image.Id.substring(7, 19),
            fullId: image.Id,
            tags: image.RepoTags || ['<none>:<none>'],
            size: image.Size,
            created: new Date(image.Created * 1000),
            labels: image.Labels
        }));
        } catch (error) {
            console.error('Failed to get images:', error);
            throw error;
        }
    }

    static async getVolumes() {
        try {
            const result = await docker.listVolumes();
            return result.Volumes.map(volume => ({
                name: volume.Name,
                driver: volume.Driver,
                mountpoint: volume.Mountpoint,
                created: volume.CreatedAt,
                labels: volume.Labels
            }));
        } catch (error) {
            console.error('Failed to get volumes:', error);
            throw error;
        }
    }

    static async createVolume(name, driver = 'local') {
        try {
        const volume = await docker.createVolume({ Name: name, Driver: driver });
        return {
            name: volume.Name,
            success: true,
            message: 'Volume created successfully'
        };
        } catch (error) {
            console.error('Failed to create volume:', error);
            throw error;
        }
    }

    static async removeVolume(name, force = false) {
        try {
            const volume = docker.getVolume(name);
            await volume.remove({ force });
            return { success: true, message: 'Volume removed successfully' };
        } catch (error) {
            console.error('Failed to remove volume:', error);
            throw error;
        }
    }
    
    static async getContainerStats(id) {
        try {
            const container = docker.getContainer(id);
            const stats = await container.stats({ stream: false });

            // Calculate CPU usage safely
            let cpuPercent = 0;
            if (stats.cpu_stats && stats.precpu_stats &&
                stats.cpu_stats.cpu_usage && stats.precpu_stats.cpu_usage &&
                stats.cpu_stats.system_cpu_usage && stats.precpu_stats.system_cpu_usage) {

                const cpuStats = stats.cpu_stats;
                const preCpuStats = stats.precpu_stats;
                const systemCpuDelta = cpuStats.system_cpu_usage - preCpuStats.system_cpu_usage;
                const cpuDelta = cpuStats.cpu_usage.total_usage - preCpuStats.cpu_usage.total_usage;

                const onlineCpus = cpuStats.online_cpus;
                const perCpuCount = cpuStats.cpu_usage?.percpu_usage?.length;
                const defaultCpuCount = 1;

                const numCpus = onlineCpus || perCpuCount || defaultCpuCount;

                if (systemCpuDelta > 0 && cpuDelta >= 0) {
                    cpuPercent = (cpuDelta / systemCpuDelta) * numCpus * 100;
                }
            }

            // Calculate memory usage safely
            const memoryUsage = stats.memory_stats?.usage || 0;
            const memoryLimit = stats.memory_stats?.limit || 1;
            const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

            // Get network stats safely
            let networkRx = 0;
            let networkTx = 0;
            if (stats.networks) {
                // Try different network interface names
                const networkKeys = Object.keys(stats.networks);
                if (networkKeys.length > 0) {
                    const firstNetwork = stats.networks[networkKeys[0]];
                    networkRx = firstNetwork.rx_bytes || 0;
                    networkTx = firstNetwork.tx_bytes || 0;
                }
            }
            return {
                cpu_percent: Math.round(cpuPercent * 100) / 100,
                memory_usage: memoryUsage,
                memory_limit: memoryLimit,
                memory_percent: Math.round(memoryPercent * 100) / 100,
                network_rx: networkRx,
                network_tx: networkTx,
                block_read: stats.blkio_stats?.io_service_bytes_recursive?.[0]?.value || 0,
                block_write: stats.blkio_stats?.io_service_bytes_recursive?.[1]?.value || 0
            };
        }catch (error){
            console.error('Failed to get container stats:', error);
            throw error;
        }
    }

}

module.exports = DockerService;