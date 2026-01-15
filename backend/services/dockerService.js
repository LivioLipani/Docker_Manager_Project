const Docker = require('dockerode');

let docker;
try {
  docker = new Docker();
} catch (error) {
    try {
        docker = new Docker({
        socketPath: process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock'
        });
    } catch (fallbackError) {
        console.error('Failed to connect to Docker:', fallbackError);
        docker = new Docker();
    }
}

class DockerService {
    static async testConnection(){
        try{
            await docker.ping();
            return true;
        }catch(error) {
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

    static async pullImage(imageName, onProgress) {
        try {
            const stream = await docker.pull(imageName);
            return new Promise((resolve, reject) => {
                docker.modem.followProgress(stream, (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                }, onProgress);
            });
        } catch (error) {
            throw error;
        }
    }

    static async removeImage(id, force = false) {
        try {
            const image = docker.getImage(id);
            await image.remove({ force });
            return { success: true, message: 'Image removed successfully' };
        } catch (error) {
            console.error('Failed to remove image:', error);
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
    
    static async createVolume(name, driver) {
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

    static async getNetworks() {
        try {
            const networks = await docker.listNetworks();
            return networks.map(network => ({
                id: network.Id.substring(0, 12),
                fullId: network.Id,
                name: network.Name,
                driver: network.Driver,
                scope: network.Scope,
                internal: network.Internal,
                attachable: network.Attachable,
                created: new Date(network.Created), 
                ipam: {
                    driver: network.IPAM?.Driver || 'default',
                    config: network.IPAM?.Config || [] 
                },
                labels: network.Labels || {}
            }));
        } catch (error) {
            console.error('Failed to get networks:', error);
            throw error;
        }
    }

    static async createNetwork(data) {
        const finalLabels = {
            ...(data.labels || {}),
            'created_by': 'dashboard-manager', 
            'created_at': new Date().toISOString()
        };


        const networkOptions = {
            Name: data.name,
            Driver: data.driver || 'bridge', 
            CheckDuplicate: true,
            Attachable: true,
            Labels: finalLabels
        };

        if (data.subnet) {
            const ipamConfig = {
                Subnet: data.subnet
            };

            if (data.gateway) {
                ipamConfig.Gateway = data.gateway;
            }

            networkOptions.IPAM = {
                Driver: 'default',
                Config: [ipamConfig]
            };
        }

        try {
            const network = await docker.createNetwork(networkOptions);
            return network;
        } catch (error) {
            console.error('Failed to create a network: ', error);
            throw error;
        }
    }

    static async startContainer(id) {
        try {
            const container = docker.getContainer(id);
            await container.start();
            return { success: true, message: 'Container started successfully' };
        } catch (error) {
            console.error('Failed to start container:', error);
            throw error;
        }
    }

    static async stopContainer(id) {
        try {
            const container = docker.getContainer(id);
            await container.stop();
            return { success: true, message: 'Container stopped successfully' };
        } catch (error) {
            console.error('Failed to stop container:', error);
            throw error;
        }
    }

    static async restartContainer(id) {
        try {
            const container = docker.getContainer(id);
            await container.restart();
        return { success: true, message: 'Container restarted successfully' };
        } catch (error) {
            console.error('Failed to restart container:', error);
            throw error;
        }
    }

    static async removeContainer(id, force = false) {
        try {
            const container = docker.getContainer(id);
            await container.remove({ force });
            return { success: true, message: 'Container removed successfully' };
        } catch (error) {
            console.error('Failed to remove container:', error);
            throw error;
        }
    }

    static async createContainer(options) {
        try {
            const container = await docker.createContainer(options);
            return {
                id: container.id.substring(0, 12),
                fullId: container.id,
                success: true,
                message: 'Container created successfully'
            };
        } catch (error) {
            console.error('Failed to create container:', error);
            throw error;
        }
    }

    static async removeNetwork(id) {
        try {
            const network = docker.getNetwork(id);
            await network.remove();
            return { message: 'Network removed successfully' };
        } catch (error) {
            console.error(`Failed to remove network (${id}):`, error);
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

            const memoryUsage = stats.memory_stats?.usage || 0;
            const memoryLimit = stats.memory_stats?.limit || 1;
            const memoryPercent = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

            let networkRx = 0;
            let networkTx = 0;
            if (stats.networks) {
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