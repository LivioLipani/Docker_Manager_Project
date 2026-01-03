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
            containerManager.loadContainers();
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
    showModal('create-volume-modal');
});

// Pull image button
document.getElementById('pull-image-btn').addEventListener('click', () => {
    showModal('pull-image-modal');
});

//Create Container button
document.getElementById('create-container-btn').addEventListener('click', () => {
    showModal('create-container-modal');
});

// Form submission handlers
document.getElementById('create-volume-form').addEventListener('submit', handleCreateVolume);
document.getElementById('pull-image-form').addEventListener('submit', handlePullImage);
document.getElementById('create-container-form').addEventListener('submit', handleCreateContainer);

//Modal Functions
function showModal(target) {
    document.getElementById(target).classList.remove('hidden');
}

function closeModal(target, form){
    document.getElementById(target).classList.add('hidden');
    if(form != '') document.getElementById(form).reset();
}

function showPullProgressModal(imageName) {
    document.getElementById('pull-image-name').textContent = imageName;
    document.getElementById('pull-progress-bar').style.width = '0%';
    document.getElementById('pull-progress-text').textContent = 'Initializing...';
    document.getElementById('pull-progress-log').innerHTML = '';
    document.getElementById('pull-progress-close-btn').disabled = true;
    document.getElementById('pull-progress-modal').classList.remove('hidden');
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
        apiManager.post('/api/volumes', volumeData);
        closeModal('create-volume-modal', 'create-volume-form');
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

const layerProgress = {};

function newupdatePullProgress(progress) {
    const progressBar = document.getElementById('pull-progress-bar');
    const progressText = document.getElementById('pull-progress-text');
    const progressLog = document.getElementById('pull-progress-log');

    // 1. Aggiorna il testo e il log
    if (progress.status) {
        progressText.textContent = progress.id 
            ? `[${progress.id}] ${progress.status}` 
            : progress.status;

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry'; // Puoi dargli stile nel CSS
        logEntry.textContent = `${new Date().toLocaleTimeString()}: ${progress.status} ${progress.id || ''}`;
        progressLog.appendChild(logEntry);
        
        // Limita il numero di righe nel log per non appesantire il DOM
        if (progressLog.childNodes.length > 50) {
            progressLog.removeChild(progressLog.firstChild);
        }
        progressLog.scrollTop = progressLog.scrollHeight;
    }

    // 2. Calcola la media reale del progresso
    if (progress.id && progress.progressDetail && progress.progressDetail.total) {
        // Memorizziamo il progresso per questo specifico layer
        layerProgress[progress.id] = (progress.progressDetail.current / progress.progressDetail.total) * 100;

        // Calcoliamo la media di tutti i layer attivi
        const layers = Object.values(layerProgress);
        const totalPercentage = Math.round(layers.reduce((a, b) => a + b, 0) / layers.length);

        progressBar.style.width = `${totalPercentage}%`;
        // Opzionale: mostra la percentuale media nel testo
        if (totalPercentage > 0) {
            progressText.textContent = `Downloading layers: ${totalPercentage}%`;
        }
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
    document.getElementById('pull-progress-text').style.color = 'white';
    e.preventDefault();

    const formData = new FormData(e.target);
    const imageData = {
        imageName: formData.get('image')
    };

    let hasError = false;

    try {
        // Close the pull image modal and show progress modal
        closeModal('pull-image-modal', 'pull-image-form');
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();

            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        let progress = JSON.parse(line);

                        if (progress.error) {
                            hasError = true;
                            throw new Error(progress.error);
                        }

                        newupdatePullProgress(progress);
                    } catch (parseError) {
                        if (parseError.message === progress?.error) throw parseError;
                            console.log('Parse error:', parseError, 'Line:', line);
                    }
                }
            }
        }

        if (hasError) {
            throw new Error("Errore durante il download dell'immagine.");
        }

        document.getElementById('pull-progress-close-btn').disabled = false;
        document.getElementById('pull-progress-text').textContent = 'Pull completed successfully!';
        
        if (imagesManager) {
            imagesManager.loadImages();
        }
    } catch (error) {
        console.error('Pull image error:', error);
        document.getElementById('pull-progress-close-btn').disabled = false;
        
        const errorText = error.message.includes('404') 
            ? `image "${imageData.imageName}" not found` 
            : error.message;
            
        document.getElementById('pull-progress-text').style.color = 'red';
        document.getElementById('pull-progress-text').textContent = 'Pull failed: ' + errorText;
    }
}

async function handleCreateContainer(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating Container...';

    const hostPorts = Array.from(document.querySelectorAll('input[name="host-port"]')).map(input => input.value).filter(v => v);
    const containerPorts = Array.from(document.querySelectorAll('input[name="container-port"]')).map(input => input.value).filter(v => v);
    const envKeys = Array.from(document.querySelectorAll('input[name="env-key"]')).map(input => input.value).filter(v => v);
    const envValues = Array.from(document.querySelectorAll('input[name="env-value"]')).map(input => input.value).filter(v => v);

    const ports = [];
    for (let i = 0; i < Math.min(hostPorts.length, containerPorts.length); i++) {
        if (hostPorts[i] && containerPorts[i]) {
            ports.push({
                host: parseInt(hostPorts[i]),
                container: parseInt(containerPorts[i])
            });
        }
    }

    const env = [];
    for (let i = 0; i < Math.min(envKeys.length, envValues.length); i++) {
        if (envKeys[i] && envValues[i]) {
            env.push(`${envKeys[i]}=${envValues[i]}`);
        }
    }

    const containerData = {
        name: formData.get('name'),
        image: formData.get('image'),
        ports: ports,
        env: env
    };

    try {
        await apiManager.post('/api/containers', containerData);
        console.log('Container created successfully');
        closeModal('create-container-modal', 'create-container-form');
        if (containerManager) {
            containerManager.loadContainers();
        }
    } catch (error) {
        console.error('Failed to create container: ' + error.message);
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

//Contaner modal
function addPortMapping() {
    const container = document.getElementById('port-mappings');
    const div = document.createElement('div');
    div.className = 'flex space-x-2 mb-2';
    div.innerHTML = `
        <input type="text" name="host-port" placeholder="Host Port"
               class="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <span class="self-center text-gray-300">:</span>
        <input type="text" name="container-port" placeholder="Container Port"
               class="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <button type="button" onclick="removePortMapping(this)" class="cursor-pointer px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">-</button>
    `;
    container.appendChild(div);
}

function removePortMapping(button) {
    button.parentElement.remove();
}

function addEnvVar() {
    const container = document.getElementById('env-vars');
    const div = document.createElement('div');
    div.className = 'flex space-x-2 mb-2';
    div.innerHTML = `
        <input type="text" name="env-key" placeholder="KEY"
               class="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <span class="self-center text-gray-300">=</span>
        <input type="text" name="env-value" placeholder="value"
               class="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <button type="button" onclick="removeEnvVar(this)" class="cursor-pointer text-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">-</button>
    `;
    container.appendChild(div);
}

function removeEnvVar(button) {
    button.parentElement.remove();
}




