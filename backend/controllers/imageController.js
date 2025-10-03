const DockerService = require('../services/dockerService');


const getImages = async (_, res) => {
    try {
        const images = await DockerService.getImages();
        res.json(images);
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({ error: 'Failed to retrieve images' });
    }
};

module.exports = {
    getImages
};