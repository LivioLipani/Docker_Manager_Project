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

    static async deployStack(name, content) {
        try {
            const parsed = yaml.load(content);
            if (!parsed || typeof parsed !== 'object') {
                throw new Error('Invalid YAML content');
            }
            if (!parsed.services) {
                throw new Error('YAML must define "services"');
            }
        } catch (e) {
            throw new Error(`YAML Syntax Error: ${e.message}`);
        }

        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '');
        const projectDir = path.join(STACKS_DIR, safeName);
        
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }

        const filePath = path.join(projectDir, 'docker-compose.yml');
        fs.writeFileSync(filePath, content);

        try {
            console.log(`Starting deployment for stack: ${name}`);

            await compose.pullAll({ 
                cwd: projectDir, 
                log: true 
            });

            await compose.upAll({ 
                cwd: projectDir, 
                log: true 
            });

            return { message: 'Stack deployed successfully', name: safeName };
        } catch (error) {
            console.error('Compose Deployment Error:', error);
            throw new Error(error.err || error.message || 'Deployment failed');
        }
    }

    static async removeStack(name) {
        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '');
        const projectDir = path.join(STACKS_DIR, safeName);
        
        if (fs.existsSync(projectDir)) {
            try {
                await compose.down({ cwd: projectDir, log: true });
                fs.rmSync(projectDir, { recursive: true, force: true });
            } catch (error) {
                throw new Error(error.err || error.message);
            }
        } else {
            throw new Error('Configuration files not found. Cannot perform clean down.');
        }
        return { message: 'Stack removed successfully' };
    }
}

module.exports = ComposeService;