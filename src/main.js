import './style.css';
import { registry } from './core/ServiceRegistry';
import { eventBus } from './core/EventBus';
import { StorageService } from './services/StorageService';
import { TeamService } from './services/TeamService';
import { NodeService } from './services/NodeService';
import { AttackService } from './services/AttackService';
import { MapComponent } from './components/MapComponent';
import { Dashboard } from './components/Dashboard';
import { Sidebar } from './components/Sidebar';
import { TeamManager } from './components/TeamManager';
import { NodeManager } from './components/NodeManager';
import { DataManager } from './components/DataManager';

import { SettingsManager } from './components/SettingsManager';
import { Modal } from './components/Modal';

async function initApp() {
    console.log('Initializing Cyber GIS System...');

    // 1. Register Core Services
    const storageService = new StorageService();
    registry.register('StorageService', storageService);
    registry.register('EventBus', eventBus);

    // 2. Register Feature Services
    const teamService = new TeamService();
    registry.register('TeamService', teamService);
    teamService.init();

    const nodeService = new NodeService();
    registry.register('NodeService', nodeService);

    const attackService = new AttackService();
    registry.register('AttackService', attackService);
    attackService.init();

    // 3. Initialize Components
    // SettingsManager needs to be first as others might check settings
    const settingsManager = new SettingsManager();
    settingsManager.init();
    registry.register('SettingsManager', settingsManager);

    const mapComponent = new MapComponent();
    await mapComponent.init();
    registry.register('MapComponent', mapComponent);

    const dashboard = new Dashboard();
    dashboard.init();
    registry.register('Dashboard', dashboard);

    const sidebar = new Sidebar();
    sidebar.init();
    registry.register('Sidebar', sidebar);

    const teamManager = new TeamManager();
    teamManager.init();
    registry.register('TeamManager', teamManager);

    const nodeManager = new NodeManager();
    nodeManager.init();
    registry.register('NodeManager', nodeManager);

    const dataManager = new DataManager();
    dataManager.init();
    registry.register('DataManager', dataManager);

    // 4. Global Handlers for HTML interactions (e.g., Popups)
    // 4. Global Handlers for HTML interactions (e.g., Popups)
    window.captureNode = (nodeId) => {
        const teams = teamService.getAllTeams();
        
        if (teams.length === 0) {
            alert('No active squads deployed! Create a team first.');
            return;
        }

        const node = nodeService.getAllNodes().find(n => n.id === nodeId);
        if (!node) return;

        // Generate Team List HTML
        let teamListHtml = `<div class="space-y-2">`;
        teams.forEach(team => {
            const isOwner = node.owner === team.id;
            const disabled = isOwner ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10 hover:border-cyber-primary cursor-pointer';
            const status = isOwner ? '(SECURED)' : '(READY)';
            
            teamListHtml += `
                <div class="team-select-btn p-3 rounded border border-gray-700 bg-black/50 ${disabled} flex items-center justify-between transition-all"
                     data-id="${team.id}" 
                     style="border-left: 4px solid ${team.color}"
                     ${!isOwner ? `onclick="window.executeHack(${nodeId}, ${team.id})"` : ''}>
                    
                    <div class="flex items-center gap-3">
                        <span class="text-xl">🛡️</span>
                        <div>
                            <div class="font-bold text-white text-sm">${team.name}</div>
                            <div class="text-[10px] text-gray-400 font-mono">ID: ${team.id}</div>
                        </div>
                    </div>
                    <div class="text-[10px] font-mono ${isOwner ? 'text-green-500' : 'text-gray-500'}">
                        ${status}
                    </div>
                </div>
            `;
        });
        teamListHtml += `</div>`;

        // Show Modal
        const modal = new Modal();
        modal.create(`INITIATE HACK: ${node.name}`, teamListHtml, null);

        // Global handler for the click (since markup is injected as string)
        window.executeHack = (nId, tId) => {
            const attacker = teamService.getTeam(tId);
            if (!attacker) return;

            console.log(`[SYSTEM] ${attacker.name} is penetrating node ${nId}...`);
            nodeService.captureNode(nId, tId);
            
            // Close modal
            const m = document.getElementById('gis-modal');
            if(m) m.remove();
        };
    };

    // 5. Start Clock & Stats
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false });
        const clockEl = document.getElementById('clock');
        if (clockEl) clockEl.innerText = timeString;
    }, 1000);

    // Initial Stats
    document.getElementById('active-nodes-count').innerText = `${nodeService.getAllNodes().length} ACTIVE NODES`;

    console.log('System Online.');
}

window.addEventListener('DOMContentLoaded', initApp);
