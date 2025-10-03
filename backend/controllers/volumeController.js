const DockerService = require('../services/dockerService');

const getVolumes = async (_, res) => {
    try {
        const volumes = await DockerService.getVolumes();
        res.json(volumes);
    } catch (error) {
        console.error('Get volumes error:', error);
        res.status(500).json({ error: 'Failed to retrieve volumes' });
    }
};

module.exports = {
    getVolumes
};