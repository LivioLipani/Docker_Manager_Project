function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString();
}

let pendingDeleteAction = null;

function showDeleteConfirmation(message, onConfirm) {
    document.getElementById('delete-confirmation-message').textContent = message;
    document.getElementById('delete-confirmation-modal').classList.remove('hidden');

    pendingDeleteAction = onConfirm;

    document.getElementById('confirm-delete-btn').onclick = () => {
        executeDelete();
    };
}

function closeDeleteConfirmation() {
    document.getElementById('delete-confirmation-modal').classList.add('hidden');
    document.getElementById('error-message-deleteConf').innerHTML = "";
    pendingDeleteAction = null;
}

async function executeDelete() {
    if (pendingDeleteAction) {
        const confirmBtn = document.getElementById('confirm-delete-btn');
        const originalContent = confirmBtn.innerHTML;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Deleting...';

        try {
            await pendingDeleteAction();
            closeDeleteConfirmation();
        } catch (error) {
            console.error('Delete action failed:', error);
            document.getElementById('error-message-deleteConf').innerHTML = error.message;
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalContent;
        }
    }
}

class VolumesManager {
    constructor() {
        this.volumes = null;
    }
    
    async loadVolumes() {
        try {
            this.volumes = await apiManager.get('/api/volumes');
            this.displayVolumes(this.volumes);
        } catch (error) {
            console.error('Failed to load volumes:', error);
            document.getElementById('volumes-table').innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Failed to load volumes: ${error.message} found</td></tr>`;
        }
    } 

    displayVolumes(volumes){
        const tbody = document.getElementById('volumes-table');
        if (volumes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-400">No volumes found</td></tr>';
            return;
        }

        tbody.innerHTML = volumes.map(volume => `
            <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${volume.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${volume.driver}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300 relative group max-w-[256px]">
                    <div class="truncate">
                        ${volume.mountpoint}
                    </div>
                    <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-4 -top-3 z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-gray-600 shadow-xl pointer-events-none">
                        ${volume.mountpoint}
                    </div>  
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${volume.created ? formatDateTime(volume.created) : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onclick="volumesManager.removeVolume('${volume.name}')" class="cursor-pointer text-red-400 hover:text-red-300" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async removeVolume(name) {
        showDeleteConfirmation(
            `Are you sure you want to remove volume "${name}"? This action cannot be undone.`,
            async () => {
                await apiManager.remove(`/api/volumes/${name}?force=true`);
                this.loadVolumes();
            }
        );
    }
}

const volumesManager = new VolumesManager();

class ImagesManager {
    constructor() {
        this.images = null;
    }

    async loadImages() {
        try {
            this.images = await apiManager.get('/api/images');
            this.displayImages(this.images);
        } catch (error) {
            console.error('Failed to load images:', error);
            document.getElementById('images-table').innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Failed to load images: ${error.message} found</td></tr>`;
        }
    }

    displayImages(images) {
        const tbody = document.getElementById('images-table');
        if (images.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-400">No images found</td></tr>';
            return;
        }

        tbody.innerHTML = images.map(image => `
            <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${image.tags[0]}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${image.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatBytes(image.size)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatDateTime(image.created)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onclick="imagesManager.removeImage('${image.id}')" class="cursor-pointer text-red-400 hover:text-red-300" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async removeImage(id) {
        showDeleteConfirmation(
            'Are you sure you want to remove this image? This action cannot be undone.',
            async () => {
                await apiManager.remove(`/api/images/${id}?force=true`);
                this.loadImages();
            }
        );
    }
}

const imagesManager = new ImagesManager();


class ContainerManager{
    constructor() {
        this.containers = null;
    }

    async loadContainers() {
        try {
            this.containers = await apiManager.get('/api/containers');
            this.displayContainers(this.containers);
        } catch (error) {
            console.error('Failed to load containers:', error);
            document.getElementById('containers-table').innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Failed to load containers: ${error.message} found</td></tr>`;
        }
    }

    getStatusBadge(status) {
        const badges = {
            running: 'bg-green-100 text-green-800',
            stopped: 'bg-red-100 text-red-800',
            exited: 'bg-gray-100 text-gray-800',
            paused: 'bg-yellow-100 text-yellow-800',
            restarting: 'bg-blue-100 text-blue-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    }

    displayContainers(containers) {
        const tbody = document.getElementById('containers-table');
        let uptime = "";

        if (containers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-400">No containers found</td></tr>';
            return;
        }

        tbody.innerHTML = containers.map(container => {
            let uptime = container.status;

            if(container.status.includes("Exited") || container.status.includes("Created")) uptime = 0;

            return `
            <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${container.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300 relative group max-w-[256px]">
                    <div class="truncate">
                        ${container.image}
                    </div>
                    <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-4 -top-3 z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-gray-600 shadow-xl pointer-events-none">
                        ${container.image}
                    </div>    
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusBadge(container.state)}">
                        ${container.state}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-300">${this.formatPorts(container.ports)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatDateTime(container.created)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${uptime}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                    ${container.state === 'running' ?
                        `<button onclick="containerManager.stopContainer('${container.id}')" class="cursor-pointer text-red-400 hover:text-red-300" title="Stop">
                            <i class="fas fa-stop"></i>
                        </button>` :
                        `<button onclick="containerManager.startContainer('${container.id}')" class="cursor-pointer text-green-400 hover:text-green-300" title="Start">
                            <i class="fas fa-play"></i>
                        </button>`
                    }
                    <button onclick="containerManager.restartContainer('${container.id}')" class="cursor-pointer text-blue-400 hover:text-blue-300" title="Restart">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button onclick="containerManager.removeContainer('${container.id}')" class="cursor-pointer text-red-400 hover:text-red-300" title="Remove">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
        }).join('');
    }

    formatPorts(ports) {
        if (!ports || ports.length === 0) {
            return '<span class="text-gray-500 text-xs">-</span>';
        }

        return ports.map(p => {
            if (p.PublicPort) {
                return `
                    <div class="flex items-center gap-1 mb-1 last:mb-0">
                        <span class="text-gray-300 font-mono text-xs font-bold" title="Host Port (Reale)">${p.PublicPort}</span>
                        <i class="fas fa-arrow-right text-[10px] text-gray-500"></i>
                        <span class="text-gray-300 font-mono text-xs" title="Container Port">${p.PrivatePort}</span>
                        <span class="text-gray-600 text-[10px] uppercase">/${p.Type}</span>
                    </div>
                `;
            } else {
                return `
                    <div class="text-xs text-gray-500 font-mono mb-1 last:mb-0">
                        ${p.PrivatePort}/${p.Type} <span class="text-[10px] italic">(exposed)</span>
                    </div>
                `;
            }
        }).join('');
    }

    async startContainer(id) {
        try {
            await apiManager.post(`/api/containers/${id}/start`);
            console.log('Container started successfully');
            this.loadContainers();
        } catch (error) {
            console.error('Failed to start container');
        }
    }

    async stopContainer(id) {
        try {
            await apiManager.post(`/api/containers/${id}/stop`);
            console.log('Container stopped successfully');
            this.loadContainers();
        } catch (error) {
            NotificationManager.error('Failed to stop container');
        }
    }

    async restartContainer(id) {
        try {
            await apiManager.post(`/api/containers/${id}/restart`);
            console.log('Container restarted successfully');
            this.loadContainers();
        } catch (error) {
            console.error('Failed to restart container');
        }
    }

    async removeContainer(id) {
        showDeleteConfirmation(
            'Are you sure you want to remove this container? This action cannot be undone.',
            async () => {
                await apiManager.remove(`/api/containers/${id}?force=true`);
                console.log('Container removed successfully');
                this.loadContainers();
            }
        );
    }
}

const containerManager = new ContainerManager();

class NetworkManager{
    constructor() {
        this.networks = null;
    }

    async loadNetworks() {
        try {
            this.networks = await apiManager.get('/api/networks');
            this.displayNetworks(this.networks);
        } catch (error) {
            console.error('Failed to load network:', error);
            document.getElementById('networks-table').innerHTML = `<tr><td colspan="6" class="px-6 py-4 text-center text-red-500">Failed to load network: ${error.message} found</td></tr>`;
        }
    }

    displayNetworks(networks) {
        const tbody = document.getElementById('networks-table');

        if (!networks || networks.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-400">No networks found</td></tr>';
            return;
        }

        tbody.innerHTML = networks.map(network => {
            const ipConfig = network.ipam?.config?.[0] || {}; 
            const subnet = ipConfig.Subnet || 'N/A';
            const gateway = ipConfig.Gateway || '';

            const systemNetworks = ['bridge', 'host', 'none'];
            
            const ipInfo = gateway 
                ? `${subnet} <br> <span class="text-xs text-gray-500">${gateway}</span>` 
                : subnet;

            const isSystem = systemNetworks.includes(network.name);

            const deleteBtn = isSystem 
                ? `<button disabled class="text-red-400 opacity-60" title="System Network">
                     <i class="fas fa-trash-alt"></i>
                   </button>`
                : `<button onclick="networksManager.deleteNetwork('${network.id}', '${network.name}')" class="cursor-pointer text-red-400 hover:text-red-300 transition-colors duration-200" title="Remove Network">
                     <i class="fas fa-trash-alt"></i>
                   </button>`;

            const connectBtn = isSystem 
            ? ''
            : `<button onclick="openConnectNetworkModal('${network.id}', '${network.name}')" 
                    class="cursor-pointer text-blue-400 hover:text-blue-300 transition-colors duration-200 ml-2" 
                    title="Connect Container">
                <i class="fas fa-plug"></i>
            </button>`;

            return `
            <tr class="hover:bg-gray-700/50 transition-colors duration-150">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-white">${network.name}</div>
                    <div class="text-xs text-gray-500 font-mono">${network.id.substring(0, 12)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        ${network.driver}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${network.scope}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${ipInfo}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    ${new Date(network.created).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    ${connectBtn}
                    ${deleteBtn}
                </td>
            </tr>
            `;
        }).join('');
    }

    deleteNetwork(id, name) {
        const message = `Are you sure you want to delete the network "${name}"? This action cannot be undone.`;

        showDeleteConfirmation(message, async () => {
            try {
                await apiManager.remove(`/api/networks/${id}`);
                
                console.log(`Network ${name} deleted successfully`);
                await this.loadNetworks();

            } catch (error) {
                const errorMsg = error.message || 'Unknown error';

                if (errorMsg.includes('409')) {
                    document.getElementById('error-message-deleteConf').innerHTML = 'Cannot delete network: It is currently in use by active containers. Please disconnect them first.';
                } else {
                    document.getElementById('error-message-deleteConf').innerHTML = `Failed to delete network: ${errorMsg}`;
                }
                throw error;
            }
        });
    }
}

const networksManager = new NetworkManager();