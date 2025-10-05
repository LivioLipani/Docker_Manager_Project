const DockerService = require('../services/dockerService');

const getContainers = async (req, res) => {
  try {
    const containers = await DockerService.getContainers();
    res.json(containers);
  } catch (error) {
    console.error('Get containers error:', error);
    res.status(500).json({ error: 'Failed to retrieve containers' });
  }
};


module.exports = {
  getContainers
};