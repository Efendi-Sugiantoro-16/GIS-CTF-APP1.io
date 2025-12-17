import { registry } from '../core/ServiceRegistry';
import { Modal } from './Modal';

export class DataManager {
    constructor() {
        this.modal = new Modal();
    }

    init() {
        // Services accessible via registry
    }

    openManager() {
        const html = `
            <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Teams Section -->
                    <div class="bg-black/40 border border-gray-700 p-4 rounded-lg">
                        <h4 class="text-cyber-primary font-bold mb-3 border-b border-gray-700 pb-2">TEAMS DATA</h4>
                        <div class="space-y-3">
                            <button id="export-teams-btn" class="w-full flex items-center justify-center gap-2 bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 border border-blue-800/50 py-2 rounded text-sm transition-all">
                                <span>⬇️</span> EXPORT TEAMS (JSON)
                            </button>
                            <label class="w-full flex items-center justify-center gap-2 bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-800/50 py-2 rounded text-sm cursor-pointer transition-all">
                                <span>⬆️</span> IMPORT TEAMS (JSON)
                                <input type="file" id="import-teams-input" accept=".json" class="hidden">
                            </label>
                        </div>
                    </div>

                    <!-- Nodes Section -->
                    <div class="bg-black/40 border border-gray-700 p-4 rounded-lg">
                        <h4 class="text-cyber-primary font-bold mb-3 border-b border-gray-700 pb-2">NODES DATA</h4>
                        <div class="space-y-3">
                            <button id="export-nodes-btn" class="w-full flex items-center justify-center gap-2 bg-blue-900/30 text-blue-300 hover:bg-blue-900/50 border border-blue-800/50 py-2 rounded text-sm transition-all">
                                <span>⬇️</span> EXPORT NODES (JSON)
                            </button>
                            <label class="w-full flex items-center justify-center gap-2 bg-green-900/30 text-green-300 hover:bg-green-900/50 border border-green-800/50 py-2 rounded text-sm cursor-pointer transition-all">
                                <span>⬆️</span> IMPORT NODES (JSON)
                                <input type="file" id="import-nodes-input" accept=".json" class="hidden">
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="text-xs text-gray-500 font-mono text-center pt-2">
                    * Ensure JSON format matches the system requirements. Importing will REPLACE existing data for that category.
                </div>
            </div>
        `;

        this.modal.create('DATA BACKUP & RESTORE', html);
        this.bindEvents();
    }

    bindEvents() {
        // TEAMS
        document.getElementById('export-teams-btn').addEventListener('click', () => {
            const data = registry.get('TeamService').exportData();
            this.downloadJSON(data, 'teams_backup.json');
        });

        document.getElementById('import-teams-input').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files[0], 'TeamService');
        });

        // NODES
        document.getElementById('export-nodes-btn').addEventListener('click', () => {
            const data = registry.get('NodeService').exportData();
            this.downloadJSON(data, 'nodes_backup.json');
        });

        document.getElementById('import-nodes-input').addEventListener('change', (e) => {
            this.handleFileImport(e.target.files[0], 'NodeService');
        });
    }

    downloadJSON(jsonStr, filename) {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    handleFileImport(file, serviceName) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const success = registry.get(serviceName).importData(data);
                if (success) {
                    alert(`${serviceName} data imported successfully!`);
                    this.modal.close();
                } else {
                    alert('Invalid Data: Must be an array of objects.');
                }
            } catch (err) {
                console.error(err);
                alert('Error parsing JSON file.');
            }
        };
        reader.readAsText(file);
    }
}
