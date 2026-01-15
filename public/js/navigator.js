const navigator = document.querySelectorAll('.nav-link');
let view = null;

navigator.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        view = link.getAttribute('data-view');
        navigateTo(view);
    })
})

const showView = (target) => {
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('containers-view').classList.add('hidden');
    document.getElementById('images-view').classList.add('hidden');
    document.getElementById('volumes-view').classList.add('hidden');
    document.getElementById('networks-view').classList.add('hidden');
    document.getElementById('compose-view').classList.add('hidden');
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
        case "networks":
            networksManager.loadNetworks();
            break;
        case "compose":
            
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

document.getElementById('create-network-btn').addEventListener('click', () => {
    showModal('create-network-modal');
});

// Form submission handlers
document.getElementById('create-volume-form').addEventListener('submit', handleCreateVolume);
document.getElementById('pull-image-form').addEventListener('submit', handlePullImage);
document.getElementById('create-container-form').addEventListener('submit', handleCreateContainer);
document.getElementById('create-network-form').addEventListener('submit', handleCreateNetwork);

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


async function handleCreateVolume(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

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
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function updatePullProgress(progress, layerProgress, maxTotalPercentage) {
    const progressBar = document.getElementById('pull-progress-bar');
    const progressText = document.getElementById('pull-progress-text');
    const progressLog = document.getElementById('pull-progress-log');

    if (progress.status) {
        progressText.textContent = progress.id 
            ? `[${progress.id}] ${progress.status}` 
            : progress.status;

        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `${new Date().toLocaleTimeString()}: ${progress.status} ${progress.id || ''}`;
        progressLog.appendChild(logEntry);
        
        if (progressLog.childNodes.length > 50) {
            progressLog.removeChild(progressLog.firstChild);
        }
        progressLog.scrollTop = progressLog.scrollHeight;
    }

    if (progress.id && progress.progressDetail && progress.progressDetail.total) {
        const currentLayerPercent = (progress.progressDetail.current / progress.progressDetail.total) * 100;

        if (!layerProgress[progress.id] || currentLayerPercent > layerProgress[progress.id]) {
            layerProgress[progress.id] = currentLayerPercent;
        }

        const layers = Object.values(layerProgress);
        const currentCalculation = Math.round(layers.reduce((a, b) => a + b, 0) / layers.length);

        if (currentCalculation > maxTotalPercentage) {
            maxTotalPercentage = currentCalculation;

            progressBar.style.width = `${maxTotalPercentage}%`;
            if (maxTotalPercentage > 0 && maxTotalPercentage < 100) {
                progressText.textContent = `Downloading: ${maxTotalPercentage}%`;
            }
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
        closeModal('pull-image-modal', 'pull-image-form');
        showPullProgressModal(imageData.imageName);

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
        const layerProgress = {};
        let maxTotalPercentage = 0;
        document.getElementById('pull-progress-bar').style.width = '0%';
        
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

                        updatePullProgress(progress, layerProgress, maxTotalPercentage);
                    } catch (parseError) {
                        if (parseError.message === progress?.error) throw parseError;
                            console.log('Parse error:', parseError, 'Line:', line);
                    }
                }
            }
        }

        if (hasError) {
            throw new Error("Error image download");
        }

        document.getElementById('pull-progress-close-btn').disabled = false;
        document.getElementById('pull-progress-text').textContent = 'Pull completed successfully!';
        
        if (imagesManager) {
            imagesManager.loadImages();
        }
    } catch (error) {
        document.getElementById('pull-progress-close-btn').disabled = false;

        let errorText = error.message;

        if(error.message == 404) errorText = `image "${imageData.imageName}" not found`;
        if(error.message == 500) errorText = "Internal sever error";

        document.getElementById('pull-progress-text').style.color = 'red';
        document.getElementById('pull-progress-text').textContent = 'Pull failed: ' + errorText;
    }
}

async function handleCreateContainer(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

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
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

async function handleCreateNetwork(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';

    const networkData = {
        name: formData.get('name'),
        driver: formData.get('driver')
    };

    const subnet = formData.get('subnet');
    const gateway = formData.get('gateway');

    if (subnet && subnet.trim() !== '') networkData.subnet = subnet;
    if (gateway && gateway.trim() !== '') networkData.gateway = gateway;

    const labelKeys = Array.from(form.querySelectorAll('input[name="label-key"]')).map(input => input.value);
    const labelValues = Array.from(form.querySelectorAll('input[name="label-value"]')).map(input => input.value);
    
    const labels = {};
    for (let i = 0; i < Math.min(labelKeys.length, labelValues.length); i++) {
        const key = labelKeys[i].trim();
        const value = labelValues[i].trim();
        if (key) {
            labels[key] = value;
        }
    }
    
    if (Object.keys(labels).length > 0) {
        networkData.labels = labels;
    }

    try {
        await apiManager.post('/api/networks', networkData);
        
        console.log('Network created successfully');
        closeModal('create-network-modal', 'create-network-form');

        if (typeof networksManager !== null) {
            networksManager.loadNetworks();
        }

    } catch (error) {
        console.error('Failed to create network: ' + error.message);
        document.getElementById('network-error').innerHTML = `Failed to create network: ${error.message}`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

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

function addNetworkLabel() {
    const container = document.getElementById('network-labels');
    const div = document.createElement('div');
    div.className = 'flex space-x-2 mb-2';
    div.innerHTML = `
        <input type="text" name="label-key" placeholder="com.example.key"
            class="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <span class="self-center text-gray-300">=</span>
        <input type="text" name="label-value" placeholder="value"
            class="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <button type="button" onclick="removeNetworkLabel(this)" class="cursor-pointer px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(div);
}

function removeNetworkLabel(button) {
    button.parentElement.remove();
}

document.querySelectorAll("th").forEach(elem => {
    elem.addEventListener("click", () => {
        switch (view) {
            case "volumes":
                volumesManager.volumes = sortTables(volumesManager.volumes, elem);
                volumesManager.displayVolumes(volumesManager.volumes);
                break;
            case "images":
                imagesManager.images = sortTables(imagesManager.images, elem);
                imagesManager.displayImages(imagesManager.images);
                break;
            case "containers":
                containerManager.containers = sortTables(containerManager.containers, elem);
                containerManager.displayContainers(containerManager.containers);
                break;
            case "networks":
                networksManager.networks = sortTables(networksManager.networks, elem);
                networksManager.displayNetworks(networksManager.networks)
                break;
        }
    })
})

const sortTables = (array, elem) => {
    let column = elem.getAttribute('data-collumn');
    let order = elem.getAttribute('data-sort');
    let text = elem.innerHTML;
    if(column != "none") text = text.substring(0, text.length - 1);

    if(order == 'desc' && column != "none"){
        elem.setAttribute('data-sort', 'asc');
        if(column == "status"){
            array = array.sort((a, b) => Number(a[column]?.match(/\d+/)?.[0] || 0) >= Number(b[column]?.match(/\d+/)?.[0] || 0) ? 1 : -1);
            text += "&#9660";
        }else{
            array = array.sort((a, b) => a[column] >= b[column] ? 1 : -1);
            text += "&#9660";
        }
    }else if(column != "none"){
        elem.setAttribute('data-sort', 'desc');
        if(column == "status"){
            array = array.sort((a, b) => Number(a[column]?.match(/\d+/)?.[0] || 0) <= Number(b[column]?.match(/\d+/)?.[0] || 0) ? 1 : -1);
            text += "&#9650";
        }else{
            array = array.sort((a, b) => a[column] < b[column] ? 1 : -1);
            text += "&#9650";
        }
    }

    elem.innerHTML = text;
    return array;
}

