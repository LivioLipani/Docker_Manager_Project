document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const toggleIcon = document.getElementById('toggle-icon');
    const sidebarTexts = document.querySelectorAll('.sidebar-text'); 
    const navLinks = document.querySelectorAll('.nav-link');       
    let isCollapsed = false;

    toggleBtn.addEventListener('click', () => {
        isCollapsed = !isCollapsed;

        if (isCollapsed) {
            sidebar.classList.remove('w-64');
            sidebar.classList.add('w-22');

            navLinks.forEach(link => {
                link.classList.remove('px-3');
                link.classList.add('justify-center', 'px-0');
            });
                
            sidebarTexts.forEach(text => {
                text.classList.add('hidden');
                text.classList.remove('opacity-100'); 
                text.classList.add('opacity-0');
            });

               
            toggleIcon.classList.remove('fa-chevron-left');
            toggleIcon.classList.add('fa-chevron-right');

        } else {
            sidebar.classList.remove('w-20');
            sidebar.classList.add('w-64');

            navLinks.forEach(link => {
                link.classList.add('px-3');
                link.classList.remove('justify-center', 'px-0');
            });
            
            sidebarTexts.forEach(text => {
                text.classList.remove('hidden');
                    
                setTimeout(() => {
                    text.classList.remove('opacity-0');
                    text.classList.add('opacity-100');
                }, 50);
            });

                
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-left');
        }
    });
});

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
            composeManager.loadStacks();
            break;
    }
}

document.getElementById('create-volume-btn').addEventListener('click', () => {
    showModal('create-volume-modal');
});

document.getElementById('pull-image-btn').addEventListener('click', () => {
    showModal('pull-image-modal');
});

document.getElementById('create-container-btn').addEventListener('click', () => {
    document.getElementById('error-create-container').innerHTML = ``;
    populateImageSelect();
    populateNetworkSelect();
    showModal('create-container-modal');
});

document.getElementById('create-network-btn').addEventListener('click', () => {
    showModal('create-network-modal');
});

document.getElementById('create-volume-form').addEventListener('submit',(e) => volumesManager.handleCreateVolume(e));
document.getElementById('pull-image-form').addEventListener('submit', (e) => imagesManager.handlePullImage(e));
document.getElementById('create-container-form').addEventListener('submit', (e) => containerManager.handleCreateContainer(e));
document.getElementById('create-network-form').addEventListener('submit', (e) => networksManager.handleCreateNetwork(e));
document.getElementById('connect-network-form').addEventListener('submit', (e) => networksManager.handleConnectContainer(e));

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

async function populateNetworkSelect() {
    const select = document.getElementById('container-network-select');
    
    select.innerHTML = '<option>Loading...</option>';

    try {
        const networks = await apiManager.get('/api/networks');
        
        select.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = 'bridge';
        defaultOption.textContent = 'bridge (Default)';
        select.appendChild(defaultOption);

        networks.forEach(net => {
            if (net.name !== 'bridge') {
                const option = document.createElement('option');
                option.value = net.name;
                option.textContent = `${net.name} (${net.driver})`;
                select.appendChild(option);
            }
        });

    } catch (error) {
        console.error('Failed to load networks for select:', error);
        select.innerHTML = '<option value="bridge">bridge (Default)</option>';
    }
}

async function populateImageSelect() {
    const select = document.getElementById('container-image-select');
    
    select.innerHTML = '<option>Loading...</option>';

    try {
        const images = await apiManager.get('/api/images');
        
        select.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = 'chicco';
        defaultOption.textContent = 'select a image';
        select.appendChild(defaultOption);

        images.forEach(im => {
            if (im.name !== 'chicco') {
                const option = document.createElement('option');
                option.value = im.tags[0];
                option.textContent = `${im.tags[0]}`;
                select.appendChild(option);
            }
        });

    } catch (error) {
        console.error('Failed to load images for select:', error);
        select.innerHTML = '<option value="chicco">select a image</option>';
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

function addDriverOption() {
    const container = document.getElementById('driver-options-container');
    const div = document.createElement('div');
    div.className = 'flex space-x-2 mb-2 option-row';
    div.innerHTML = `
        <input type="text" name="option-key" placeholder="Key (e.g. parent)"
            class="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <span class="self-center text-gray-300">=</span>
        <input type="text" name="option-value" placeholder="Value (e.g. eth0)"
            class="flex-1 px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
        <button type="button" onclick="removeDriverOption(this)" 
            class="cursor-pointer px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(div);
}

function removeDriverOption(button) {
    button.parentElement.remove()
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

