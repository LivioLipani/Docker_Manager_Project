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
                        <button onclick="imagesManager.runImage('${image.id}')" class="cursor-pointer text-green-400 hover:text-green-300" title="Run">
                            <i class="fas fa-play"></i>
                        </button>
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

    runImage(id) {

        
    }

}

const imagesManager = new ImagesManager();