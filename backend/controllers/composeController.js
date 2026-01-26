const ComposeService = require('../services/composeService');
const DockerService = require('../services/dockerService');

const listStacks = async (req, res) => {
    try {
        const stacks = await ComposeService.listStacks(DockerService.docker);
        res.json(stacks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const deployStack = async (req, res) => {
    const { name, content } = req.body;

    console.log(content);
    
    if (!name || !content) {
        return res.status(400).json({ message: 'Stack name and YAML content are required' });
    }

    try {
        const result = await ComposeService.deployStack(name, content);
        res.status(201).json(result);
    } catch (error) {
        const status = error.message.includes('YAML') ? 400 : 500;
        res.status(status).json({message: error.message});
    }
};

const removeStack = async (req, res) => {
    const { name } = req.params;
    try {
        await ComposeService.removeStack(name);
        res.json({ message: 'Stack removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports ={
    listStacks,
    deployStack,
    removeStack
}