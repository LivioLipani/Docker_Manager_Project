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

const createContainer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required to create containers' });
    }

    const { name, image, ports, env, volumes } = req.body;

    if (!name || !image) {
      return res.status(400).json({ error: 'Container name and image are required' });
    }

    const createOptions = {
      name,
      Image: image,
      Env: env || [],
      ExposedPorts: {},
      HostConfig: {
        PortBindings: {},
        Binds: volumes || []
      }
    };

    if (ports && Array.isArray(ports)) {
      ports.forEach(port => {
        if (port.container && port.host) {
          createOptions.ExposedPorts[`${port.container}/tcp`] = {};
          createOptions.HostConfig.PortBindings[`${port.container}/tcp`] = [{ HostPort: port.host.toString() }];
        }
      });
    }

    const result = await DockerService.createContainer(createOptions);
    res.status(201).json(result);
  } catch (error) {
    console.error('Create container error:', error);
    res.status(500).json({ error: 'Failed to create container' });
  }
};

const startContainer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required to start containers' });
    }

    const { id } = req.params;
    const result = await DockerService.startContainer(id);
    res.json(result);
  } catch (error) {
    console.error('Start container error:', error);
    res.status(500).json({ error: 'Failed to start container' });
  }
};

const stopContainer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required to stop containers' });
    }

    const { id } = req.params;
    const result = await DockerService.stopContainer(id);
    res.json(result);
  } catch (error) {
    console.error('Stop container error:', error);
    res.status(500).json({ error: 'Failed to stop container' });
  }
};

const removeContainer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required to remove containers' });
    }

    const { id } = req.params;
    const { force } = req.query;
    const result = await DockerService.removeContainer(id, force === 'true');
    res.json(result);
  } catch (error) {
    console.error('Remove container error:', error);
    res.status(500).json({ error: 'Failed to remove container' });
  }
};

const restartContainer = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required to restart containers' });
    }

    const { id } = req.params;
    const result = await DockerService.restartContainer(id);
    res.json(result);
  } catch (error) {
    console.error('Restart container error:', error);
    res.status(500).json({ error: 'Failed to restart container' });
  }
};


module.exports = {
  getContainers,
  createContainer,
  startContainer,
  stopContainer,
  restartContainer,
  removeContainer
};