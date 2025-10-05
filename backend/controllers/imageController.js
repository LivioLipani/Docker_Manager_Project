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

const pullImage = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required to pull images' });
        }

        const { imageName } = req.body;

        if (!imageName) {
            return res.status(400).json({ error: 'Image name is required' });
        }

        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Transfer-Encoding': 'chunked'
        });

        await DockerService.pullImage(imageName, (progress) => {
            res.write(JSON.stringify(progress) + '\n');
        });

        res.end(JSON.stringify({ success: true, message: 'Image pulled successfully' }));
    } catch (error) {
            console.error('Pull image error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to pull image' });
        } else {
            res.end(JSON.stringify({ error: 'Failed to pull image' }));
        }
    }
};

const removeImage = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required to remove images' });
        }

        const { id } = req.params;
        const { force } = req.query;
        const result = await DockerService.removeImage(id, force === 'true');
        res.json(result);
    } catch (error) {
        console.error('Remove image error:', error);
        res.status(500).json({ error: 'Failed to remove image' });
    }
};

module.exports = {
    getImages,
    pullImage,
    removeImage
};