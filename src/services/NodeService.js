import { registry } from '../core/ServiceRegistry';
import { eventBus } from '../core/EventBus';
import { countries } from '../data/Countries';

export class NodeService {
    constructor() {
        this.storage = registry.get('StorageService');
        this.nodes = this.storage.get('nodes') || this.getDefaultNodes();
    }

    getDefaultNodes() {
        // Map 197 countries to CTF Nodes
        return countries.map((country, index) => ({
            id: index + 1000,
            name: `${country.capital} [${country.name}]`,
            lat: country.lat,
            lng: country.lng,
            owner: null,
            difficulty: this.getRandomDifficulty(),
            points: Math.floor(Math.random() * 500) + 100
        }));
    }

    getRandomDifficulty() {
        const levels = ['EASY', 'MEDIUM', 'HARD', 'EXTREME'];
        return levels[Math.floor(Math.random() * levels.length)];
    }

    getAllNodes() {
        return this.nodes;
    }

    addNode(nodeData) {
        const newNode = {
            id: Date.now(),
            name: nodeData.name || 'Unknown Node',
            lat: nodeData.lat,
            lng: nodeData.lng,
            owner: null,
            difficulty: nodeData.difficulty || 'MEDIUM',
            points: nodeData.points || 100,
            connectedTo: nodeData.connectedTo || null
        };
        this.nodes.push(newNode);
        this.save();
        eventBus.emit('NODE_ADDED', newNode);
        return newNode;
    }

    updateNode(id, data) {
         const index = this.nodes.findIndex(n => n.id === id);
         if (index !== -1) {
             this.nodes[index] = { ...this.nodes[index], ...data };
             this.save();
             eventBus.emit('NODE_UPDATED', this.nodes[index]);
         }
    }

    deleteNode(id) {
        this.nodes = this.nodes.filter(n => n.id !== id);
        this.save();
        eventBus.emit('NODE_DELETED', id);
    }

    captureNode(nodeId, teamId) {
        const node = this.nodes.find(n => n.id === nodeId);
        if (node) {
            const oldOwner = node.owner;
            node.owner = teamId;
            this.save();
            eventBus.emit('NODE_CAPTURED', { node, teamId, oldOwner });
            
            // Update team score via TeamService (Event based communication usually better for decoupling, 
            // but for simplicity we assume the controller handles this or we emit event and listener handles it)
        }
    }

    save() {
        this.storage.save('nodes', this.nodes);
    }

    // Data I/O
    importData(data) {
        if (Array.isArray(data)) {
            this.nodes = data;
            this.save();
            eventBus.emit('NODE_UPDATED'); // Refresh all
            return true;
        }
        return false;
    }

    exportData() {
        return JSON.stringify(this.nodes, null, 2);
    }
}
