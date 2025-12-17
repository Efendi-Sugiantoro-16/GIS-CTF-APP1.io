import { registry } from '../core/ServiceRegistry';
import { Modal } from './Modal';

export class TeamManager {
    constructor() {
        this.teamService = null;
        this.modal = new Modal();
    }

    init() {
        this.teamService = registry.get('TeamService');
    }

    openManager() {
        const teams = this.teamService.getAllTeams();
        const html = `
            <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                ${teams.map(team => `
                    <div class="flex items-center justify-between p-3 bg-black/30 border border-gray-700 rounded hover:border-cyber-primary/30 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]" style="background-color: ${team.color}; color: ${team.color}"></div>
                            <div>
                                <div class="font-bold text-sm">${team.name}</div>
                                <div class="text-[10px] text-gray-500 font-mono">ID: ${team.id}</div>
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button class="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-blue-300 edit-team-btn" data-id="${team.id}">EDIT</button>
                            <button class="text-xs bg-red-900/30 hover:bg-red-900/60 px-2 py-1 rounded text-red-400 delete-team-btn" data-id="${team.id}">DEL</button>
                        </div>
                    </div>
                `).join('')}
                
                ${teams.length === 0 ? '<div class="text-center text-gray-500 py-4">No teams deployed.</div>' : ''}
                
                <button id="manager-add-team" class="w-full py-2 border border-cyber-primary/50 text-cyber-primary hover:bg-cyber-primary/10 rounded font-mono text-sm mt-2">+ DEPLOY NEW TEAM</button>
            </div>
        `;

        this.modal.create('MANAGE SQUADS', html);

        // Bind Events inside modal
        document.getElementById('manager-add-team').addEventListener('click', () => {
            this.modal.close();
            this.openAddEditForm(); // Add mode
        });

        document.querySelectorAll('.edit-team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.dataset.id);
                this.modal.close();
                this.openAddEditForm(id); // Edit mode
            });
        });

        document.querySelectorAll('.delete-team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if(confirm('Delete this team?')) {
                    const id = parseInt(e.target.dataset.id);
                    this.teamService.deleteTeam(id);
                    this.modal.close();
                    this.openManager(); // Re-open to refresh
                }
            });
        });
    }

    openAddEditForm(teamId = null) {
        const team = teamId ? this.teamService.getTeam(teamId) : { name: '', color: '#00ff9d' };
        
        const html = `
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-mono text-gray-400 mb-1">SQUAD NAME</label>
                    <input type="text" id="team-name" value="${team.name}" class="w-full bg-black/50 border border-gray-600 rounded p-2 text-white focus:border-cyber-primary outline-none">
                </div>
                <div>
                    <label class="block text-xs font-mono text-gray-400 mb-1">COLOR (HEX)</label>
                    <div class="flex gap-2">
                        <input type="color" id="team-color-picker" value="${team.color}" class="h-10 w-10 bg-transparent border-none cursor-pointer">
                        <input type="text" id="team-color" value="${team.color}" class="flex-1 bg-black/50 border border-gray-600 rounded p-2 text-white font-mono uppercase">
                    </div>
                </div>
            </div>
        `;

        this.modal.create(teamId ? 'EDIT SQUAD' : 'DEPLOY SQUAD', html, () => {
            const name = document.getElementById('team-name').value;
            const color = document.getElementById('team-color').value;
            
            if (name && color) {
                if (teamId) {
                    this.teamService.updateTeam(teamId, { name, color });
                } else {
                    this.teamService.addTeam(name, color);
                }
            }
        });

        // Sync inputs
        const picker = document.getElementById('team-color-picker');
        const text = document.getElementById('team-color');
        picker.addEventListener('input', (e) => text.value = e.target.value);
        text.addEventListener('input', (e) => picker.value = e.target.value);
    }
}
