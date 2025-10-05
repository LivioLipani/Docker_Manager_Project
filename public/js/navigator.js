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

// Form submission handlers
document.getElementById('create-volume-form').addEventListener('submit', handleCreateVolume);

//modal element Volume
function showCreateVolumeModal() {
    document.getElementById('create-volume-modal').classList.remove('hidden');
}

function closeCreateVolumeModal() {
    document.getElementById('create-volume-modal').classList.add('hidden');
    document.getElementById('create-volume-form').reset();
}

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
        //NotificationManager.success('Volume created successfully');
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


