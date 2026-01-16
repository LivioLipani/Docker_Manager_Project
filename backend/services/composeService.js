const compose = require('docker-compose'); 
const fs = require('fs');                
const path = require('path');            
const yaml = require('js-yaml');

const STACKS_DIR = path.join(__dirname, '../storage/stacks');

if (!fs.existsSync(STACKS_DIR)) {
    fs.mkdirSync(STACKS_DIR, { recursive: true });
}

class ComposeService {
    static async listStacks(docker) {
        const containers = await docker.listContainers({ all: true });
        const stacks = {};

        containers.forEach(c => {
            const projectName = c.Labels['com.docker.compose.project'];
            
            if (projectName) {
                if (!stacks[projectName]) {
                    stacks[projectName] = { 
                        name: projectName, 
                        status: 'stopped',
                        services: 0,
                        path: path.join(STACKS_DIR, projectName)
                    };
                }
                
                stacks[projectName].services++;
                
                if (c.State === 'running') {
                    stacks[projectName].status = 'running';
                }
            }
        });

        return Object.values(stacks);
    }
}

module.exports = ComposeService;