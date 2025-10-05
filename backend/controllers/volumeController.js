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

const removeVolume = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required to remove volumes' });
        }

        const { name } = req.params;
        const { force } = req.query;
        const result = await DockerService.removeVolume(name, force === 'true');
        res.json(result);
    } catch (error) {
        console.error('Remove volume error:', error);
        res.status(500).json({ error: 'Failed to remove volume' });
    }
}

const createVolume = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required to create volumes' });
        }

        const { name, driver = 'local' } = req.body;

        if (!name) {
        return res.status(400).json({ error: 'Volume name is required' });
        }

        const result = await DockerService.createVolume(name, driver);
        res.status(201).json(result);
    } catch (error) {
        console.error('Create volume error:', error);
        res.status(500).json({ error: 'Failed to create volume' });
    }
};

module.exports = {
    getVolumes,
    removeVolume,
    createVolume
};