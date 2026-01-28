const DockerService = require('../services/dockerService');

const getNetworks = async (req, res) => {
    try {
        const networks = await DockerService.getNetworks();

        res.status(200).json(networks);
        
    } catch (error) {
        console.error('Controller Error - getNetworks:', error);
        res.status(500).json({ 
            message: 'Failed to fetch docker networks', 
            error: error.message 
        });
    }
};

const createNetwork = async (req, res) => {
    try {
        const { name, driver, subnet, gateway, labels, driverOptions } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Network name is required' });
        }

        const result = await DockerService.createNetwork({ 
            name, 
            driver, 
            subnet, 
            gateway,
            labels,
            driverOptions 
        });

        res.status(201).json({
            message: 'Network created successfully',
            id: result.id,
            warning: result.Warning || null
        });

    } catch (error) {
        console.error('Controller Error - createNetwork:', error);

        if (error.statusCode === 409) {
            return res.status(409).json({ message: 'A network with this name already exists' });
        }

        res.status(500).json({ 
            message: 'Failed to create network', 
            error: error.message 
        });
    }
};

const connectContainer = async (req, res) => {
    const { id } = req.params; 
    const { containerId } = req.body;

    if (!containerId) {
        return res.status(400).json({ message: 'Container ID is required' });
    }

    try {
        await DockerService.connectContainerToNetwork(id, containerId);
        res.status(200).json({ message: 'Container connected to network successfully' });
    } catch (error) {
        console.error('Controller Error - connectContainer:', error);
        
        const dockerMsg = error.json?.message || error.message || '';

        if (error.statusCode === 404) {
            if (dockerMsg.includes('No such container')) {
                return res.status(404).json({ message: 'The selected container does not exist anymore' });
            }
            return res.status(404).json({ message: 'Network not found' });
        }

        if (error.statusCode === 409 || dockerMsg.includes('already exists')) {
            return res.status(409).json({ message: 'Container is already connected to this network' });
        }

        if (error.statusCode === 403) {
            return res.status(403).json({ message: 'Operation not allowed on this network' });
        }

        res.status(500).json({ message: 'Failed to connect container', error: dockerMsg });
    }
};

const deleteNetwork = async (req, res) => {
    const { id } = req.params;

    try {
        await DockerService.removeNetwork(id);
        res.status(200).json({ message: 'Network deleted successfully' });
    } catch (error) {
        console.error('Controller Error - deleteNetwork:', error);

        const dockerMessage = error.json?.message || error.message || '';

        if (error.statusCode === 404) {
            return res.status(404).json({ message: 'Network not found' });
        }

        const isNetworkInUse = 
            error.statusCode === 409 || 
            (error.statusCode === 403 && (dockerMessage.includes('in use') || dockerMessage.includes('active endpoints')));

        if (isNetworkInUse) {
            return res.status(409).json({ 
                message: 'Cannot delete network: active containers are using it. Disconnect them first.' 
            });
        }

        if (error.statusCode === 403) {
             return res.status(403).json({ message: 'Cannot delete a pre-defined system network' });
        }

        res.status(500).json({ 
            message: 'Failed to delete network', 
            error: dockerMessage 
        });
    }
};

module.exports = {
    getNetworks,
    createNetwork,
    deleteNetwork,
    connectContainer
};