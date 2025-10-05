const navigator = document.querySelectorAll('.nav-link');

navigator.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        navigateTo(view);
    })
})

const showView = (target) => {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('containers-view').classList.add('hidden');
    document.getElementById('images-view').classList.add('hidden');
    document.getElementById('volumes-view').classList.add('hidden');
    console.log(target);

    document.getElementById(`${target}-view`).classList.remove('hidden');
    updateNavigation(target);
}

const updateNavigation = (activeView) => {
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.remove("bg-gray-900", "text-white");
        link.classList.add("text-gray-300", "hover:bg-gray-700");
    });

    const activeLink = document.querySelector(`[data-view="${activeView}"]`);
    if (activeLink) {
        activeLink.classList.add("bg-gray-900", "text-white", "hover:bg-gray-700");
        activeLink.classList.remove("text-gray-300", "hover:bg-gray-700");
    }
};

const navigateTo = (target) => {
    
    showView(target);

    switch (target) {
        case "containers":
            loadContainers();
            break;
        case "images":
            imagesManager.loadImages();
            break;
        case "volumes":
            volumesManager.loadVolumes();
            break;
    }
}

// Create volume button
document.getElementById('create-volume-btn').addEventListener('click', () => {
    showCreateVolumeModal();
});

// Pull image button
document.getElementById('pull-image-btn').addEventListener('click', () => {
    showPullImageModal();
});

// Form submission handlers
document.getElementById('create-volume-form').addEventListener('submit', handleCreateVolume);
document.getElementById('pull-image-form').addEventListener('submit', handlePullImage);


//Modal Functions
function showCreateVolumeModal() {
    document.getElementById('create-volume-modal').classList.remove('hidden');
}

function closeCreateVolumeModal() {
    document.getElementById('create-volume-modal').classList.add('hidden');
    document.getElementById('create-volume-form').reset();
}

function showPullImageModal() {
    document.getElementById('pull-image-modal').classList.remove('hidden');
}

function closePullImageModal() {
    document.getElementById('pull-image-modal').classList.add('hidden');
    document.getElementById('pull-image-form').reset();
}

function showPullProgressModal(imageName) {
    document.getElementById('pull-image-name').textContent = imageName;
    document.getElementById('pull-progress-bar').style.width = '0%';
    document.getElementById('pull-progress-text').textContent = 'Initializing...';
    document.getElementById('pull-progress-log').innerHTML = '';
    document.getElementById('pull-progress-close-btn').disabled = true;
    document.getElementById('pull-progress-modal').classList.remove('hidden');
}

function closePullProgressModal() {
    document.getElementById('pull-progress-modal').classList.add('hidden');
}

//Handle functions
async function handleCreateVolume(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Volume...';

    const volumeData = {
        name: formData.get('name'),
        driver: formData.get('driver')
    };

    try {
        apiManager.create('/api/volumes', volumeData);
        closeCreateVolumeModal();
        if (volumesManager) {
            volumesManager.loadVolumes();
        }
    } catch (error) {
        console.error('Failed to create volume: ' + error.message);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function updatePullProgress(progress) {
    const progressBar = document.getElementById('pull-progress-bar');
    const progressText = document.getElementById('pull-progress-text');
    const progressLog = document.getElementById('pull-progress-log');

    if (progress.status) {
        progressText.textContent = progress.status;

        // Add to log
        const logEntry = document.createElement('div');
        logEntry.textContent = `${new Date().toLocaleTimeString()}: ${progress.status}`;
        progressLog.appendChild(logEntry);
        progressLog.scrollTop = progressLog.scrollHeight;
    }

    if (progress.progressDetail) {
        const detail = progress.progressDetail;
        if (detail.current && detail.total) {
            const percentage = Math.round((detail.current / detail.total) * 100);
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `${progress.status} (${percentage}%)`;
        }
    }
}

async function handlePullImage(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const imageData = {
        imageName: formData.get('image')
    };

    try {
        // Close the pull image modal and show progress modal
        closePullImageModal();
        showPullProgressModal(imageData.imageName);

        // Use streaming fetch for real-time updates
        const response = await fetch('/api/images/pull', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthManager.getToken()}`
            },
            body: JSON.stringify(imageData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const progress = JSON.parse(line);
                        updatePullProgress(progress);
                    } catch (parseError) {
                        console.log('Parse error:', parseError, 'Line:', line);
                    }
                }
            }
        }

        // Enable close button and show completion
        document.getElementById('pull-progress-close-btn').disabled = false;
        document.getElementById('pull-progress-text').textContent = 'Pull completed successfully!';
        
        if (imagesManager) {
            imagesManager.loadImages();
        }
    } catch (error) {
        console.error('Pull image error:', error);
        document.getElementById('pull-progress-close-btn').disabled = false;
        document.getElementById('pull-progress-text').textContent = 'Pull failed: ' + error.message;
    }
}


