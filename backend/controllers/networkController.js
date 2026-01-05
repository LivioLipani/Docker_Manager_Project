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

module.exports = {
    getNetworks
};