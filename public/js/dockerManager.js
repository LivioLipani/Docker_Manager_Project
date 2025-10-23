function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString();
}

let pendingDeleteAction = null;

function showDeleteConfirmation(message, onConfirm) {
    document.getElementById('delete-confirmation-message').textContent = message;
    document.getElementById('delete-confirmation-modal').classList.remove('hidden');

    pendingDeleteAction = onConfirm;

    // Bind the confirm button
    document.getElementById('confirm-delete-btn').onclick = () => {
        executeDelete();
    };
}

function closeDeleteConfirmation() {
    document.getElementById('delete-confirmation-modal').classList.add('hidden');
    pendingDeleteAction = null;
}

async function executeDelete() {
    if (pendingDeleteAction) {
        const confirmBtn = document.getElementById('confirm-delete-btn');
        const originalContent = confirmBtn.innerHTML;

        // Show loading state
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Deleting...';

        try {
            await pendingDeleteAction();
            closeDeleteConfirmation();
        } catch (error) {
            // Error is already handled in the delete action
            console.error('Delete action failed:', error);
        } finally {
            // Reset button state
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = originalContent;
        }
    }
}

class VolumesManager {
    
    async loadVolumes() {
        try {
            const volumes = await apiManager.get('/api/volumes');
            this.displayVolumes(volumes);
        } catch (error) {
            console.error('Failed to load volumes:', error);
        }
    } 

    displayVolumes(volumes){
        const tbody = document.getElementById('volumes-table');
        if (volumes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-400">No volumes found</td></tr>';
            return;
        }

        tbody.innerHTML = volumes.map(volume => `
            <tr class="hover:bg-gray-700 rounded-lg">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${volume.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${volume.driver}</td>
                <td class="px-6 py-4 text-sm text-gray-300">${volume.mountpoint}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${volume.created ? formatDateTime(volume.created) : 'N/A'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
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

    async loadImages() {
        try {
            const images = await apiManager.get('/api/images');
            this.displayImages(images);
        } catch (error) {
            console.error('Failed to load images:', error);
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
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="imagesManager.removeImage('${image.id}')" class="cursor-pointer text-red-400 hover:text-red-300" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
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

    async loadContainers() {
        try {
            const containers = await apiManager.get('/api/containers');
            this.displayContainers(containers);
        } catch (error) {
            console.error('Failed to load containers:', error);
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

        if (containers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-400">No containers found</td></tr>';
            return;
        }

        tbody.innerHTML = containers.map(container => `
            <tr class="hover:bg-gray-700">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">${container.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${container.image}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${this.getStatusBadge(container.state)}">
                        ${container.state}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-300">${this.formatPorts(container.ports)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${formatDateTime(container.created)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
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
                    </div>
                </td>
            </tr>
        `).join('');
    }

    formatPorts(ports) {
        if (!ports || ports.length === 0) return '-';
        return ports.map(port => `${port.PublicPort || ''}:${port.PrivatePort}`).join(', ');
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
