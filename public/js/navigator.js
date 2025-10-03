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
            loadImages();
            break;
        case "volumes":
            loadVolumes();
            break;
    }
}

const loadVolumes = () => {

}