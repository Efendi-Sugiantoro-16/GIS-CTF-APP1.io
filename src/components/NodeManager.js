import { registry } from '../core/ServiceRegistry';
import { eventBus } from '../core/EventBus';
import { Modal } from './Modal';
import L from 'leaflet';

export class NodeManager {
    constructor() {
        this.nodeService = null;
        this.mapComponent = null;
        this.modal = new Modal();
        this.addMode = false;
        this.addMarkerPreview = null;
    }

    init() {
        this.nodeService = registry.get('NodeService');
        this.mapComponent = registry.get('MapComponent');

        // Allow deleting/editing from popup (Global hook)
        window.editNode = (id) => this.openEditForm(id);
        window.deleteNode = (id) => this.deleteNode(id);
        
        // Listen to map clicks for adding nodes
        this.mapComponent.map.on('click', (e) => {
            if (this.addMode) {
                this.openAddForm(e.latlng);
                this.disableAddMode();
            }
        });
    }

    enableAddMode() {
        this.addMode = true;
        document.body.style.cursor = 'crosshair';
        alert('CLICK ON MAP TO PLACE NEW NODE');
    }

    disableAddMode() {
        this.addMode = false;
        document.body.style.cursor = 'default';
    }

    openAddForm(latlng) {
        const html = `
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-mono text-gray-400 mb-1">NODE NAME</label>
                    <input type="text" id="node-name" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-cyber-primary outline-none" placeholder="e.g. Server Jakarta">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-mono text-gray-400 mb-1">DIFFICULTY</label>
                        <select id="node-difficulty" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white">
                            <option value="EASY">EASY</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HARD">HARD</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-mono text-gray-400 mb-1">POINTS</label>
                        <input type="number" id="node-points" value="100" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white">
                    </div>
                </div>
                <div>
                   <label class="block text-xs font-mono text-gray-400 mb-1">CONNECT TO (OPTIONAL)</label>
                   <select id="node-connection" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white">
                       <option value="">-- AUTO / NONE --</option>
                       ${this.nodeService.getAllNodes().map(n => `<option value="${n.id}">${n.name}</option>`).join('')}
                   </select>
                </div>
                <div class="text-xs text-gray-500 font-mono">
                    Lat: ${latlng.lat.toFixed(4)} | Lng: ${latlng.lng.toFixed(4)}
                </div>
            </div>
        `;

        this.modal.create('ADD NEW NODE', html, () => {
            const name = document.getElementById('node-name').value;
            const difficulty = document.getElementById('node-difficulty').value;
            const points = parseInt(document.getElementById('node-points').value);
            const connectedTo = document.getElementById('node-connection').value;

            if (name) {
                this.nodeService.addNode({
                    name,
                    lat: latlng.lat,
                    lng: latlng.lng,
                    difficulty,
                    points,
                    connectedTo: connectedTo ? parseInt(connectedTo) : null
                });
            }
        });
    }

    openEditForm(id) {
        const node = this.nodeService.getAllNodes().find(n => n.id === id);
        if(!node) return;

        const html = `
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-mono text-gray-400 mb-1">NODE NAME</label>
                    <input type="text" id="edit-node-name" value="${node.name}" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-cyber-primary outline-none">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-mono text-gray-400 mb-1">DIFFICULTY</label>
                        <select id="edit-node-difficulty" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white">
                            <option value="EASY" ${node.difficulty === 'EASY' ? 'selected' : ''}>EASY</option>
                            <option value="MEDIUM" ${node.difficulty === 'MEDIUM' ? 'selected' : ''}>MEDIUM</option>
                            <option value="HARD" ${node.difficulty === 'HARD' ? 'selected' : ''}>HARD</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-mono text-gray-400 mb-1">POINTS</label>
                        <input type="number" id="edit-node-points" value="${node.points}" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white">
                    </div>
                </div>
                <div>
                   <label class="block text-xs font-mono text-gray-400 mb-1">CONNECT TO (OPTIONAL)</label>
                   <select id="edit-node-connection" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white">
                       <option value="">-- DEFAULT / NONE --</option>
                       ${this.nodeService.getAllNodes().filter(n => n.id !== node.id).map(n => 
                           `<option value="${n.id}" ${node.connectedTo === n.id ? 'selected' : ''}>${n.name}</option>`
                       ).join('')}
                   </select>
                </div>
            </div>
        `;

        this.modal.create('EDIT NODE', html, () => {
            const name = document.getElementById('edit-node-name').value;
            const difficulty = document.getElementById('edit-node-difficulty').value;
            const points = parseInt(document.getElementById('edit-node-points').value);
            const connectedTo = document.getElementById('edit-node-connection').value;

            this.nodeService.updateNode(id, { 
                name, 
                difficulty, 
                points,
                connectedTo: connectedTo ? parseInt(connectedTo) : null 
            });
             // Force re-render map nodes (simplest way is reload or better, emit event which map listens to)
             // Map listens to NODE_UPDATED so it might handle marker update depending on MapComponent implementation
             // Actually currently MapComponent adds marker but doesn't clear old ones easily without full re-render
             // We'll rely on MapComponent handling NODE_UPDATED if implemented, or we force it.
             registry.get('MapComponent').renderNodes(); 
        });
    }

    deleteNode(id) {
        if(confirm('ARE YOU SURE? THIS WILL REMOVE THE NODE PERMANENTLY.')) {
            this.nodeService.deleteNode(id);
            // MapComponent needs to listen to NODE_DELETED or we manually refresh
            registry.get('MapComponent').removeMarker(id);
        }
    }
}
