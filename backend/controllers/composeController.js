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

module.exports ={
    listStacks
}