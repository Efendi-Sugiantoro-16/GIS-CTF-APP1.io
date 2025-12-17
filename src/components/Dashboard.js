import { registry } from '../core/ServiceRegistry';
import { eventBus } from '../core/EventBus';

export class Dashboard {
    constructor() {
        this.container = null; // Will target 'dashboard-container'
        this.teamService = null;
        this.nodeService = null;
    }

    init() {
        this.teamService = registry.get('TeamService');
        this.nodeService = registry.get('NodeService');
        
        // Target the main wrapper, not just the grid
        this.container = document.getElementById('dashboard-container'); 
        
        this.render();
        
        // Listen for updates
        eventBus.on('TEAM_UPDATED', () => this.update());
        eventBus.on('TEAM_ADDED', () => this.update());
        eventBus.on('NODE_CAPTURED', () => this.update());
        eventBus.on('NODE_ADDED', () => this.update());
        eventBus.on('NODE_DELETED', () => this.update());

        this.setupAddButton();
    }

    setupAddButton() {
        // Need to delegate this since we might re-render the button
        this.container.addEventListener('click', (e) => {
            if(e.target.id === 'add-team-btn' || e.target.closest('#add-team-btn')) {
                const name = prompt("Enter Squad Name:");
                if(name) {
                    const colors = ['#00ff9d', '#7000ff', '#ff0055', '#00f7ff', '#ffcc00'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    this.teamService.addTeam(name, color);
                }
            }
        });
    }

    render() {
        this.update();
    }

    update() {
        if (!this.container) return;

        const teams = this.teamService.getAllTeams().sort((a,b) => b.score - a.score);
        const totalNodes = this.nodeService.getAllNodes().length;

        // SECTION 1: LEADERBOARD LIST (Top)
        const listHtml = teams.map((team, index) => {
            const captured = team.nodesCaptured || 0;
            const percentage = totalNodes > 0 ? ((captured / totalNodes) * 100).toFixed(1) : 0;
            
            return `
            <div class="group relative bg-black/40 border border-gray-800 hover:border-gray-600 rounded p-3 flex items-center gap-4 transition-all mb-2"
                 style="border-left: 4px solid ${team.color}">
                
                <div class="flex items-center gap-3 w-48 shrink-0">
                    <div class="font-mono text-gray-500 text-sm">#${index + 1}</div>
                    <div class="w-8 h-8 rounded bg-gray-900 flex items-center justify-center text-xl">🛡️</div>
                    <div class="overflow-hidden">
                         <div class="font-bold text-white text-sm leading-none truncate">${team.name}</div>
                         <div class="text-[10px] text-gray-500 font-mono mt-0.5">${team.ip || '192.168.1.XXX'}</div>
                    </div>
                </div>

                <div class="flex-1 hidden md:block">
                    <div class="flex justify-between text-[10px] font-mono text-gray-400 mb-1">
                        <span>CONTROL: ${percentage}%</span>
                    </div>
                    <div class="h-2 w-full bg-gray-900 rounded-full overflow-hidden relative">
                         <div class="absolute inset-0 bg-gray-800/50"></div>
                         <div class="h-full rounded-full transition-all duration-700 relative" 
                              style="width: ${percentage}%; background-color: ${team.color}; box-shadow: 0 0 10px ${team.color}">
                         </div>
                    </div>
                </div>

                <div class="w-24 text-right shrink-0">
                    <div class="text-blue-400 font-bold font-mono text-sm">${percentage}%</div>
                </div>
            </div>
            `;
        }).join('');

        // SECTION 2: TEAM CARD GRID (Bottom)
        const gridHtml = teams.map((team, index) => {
            return `
            <div class="flex flex-col bg-black/80 border border-gray-700/50 rounded-xl p-4 relative overflow-hidden transition-all hover:border-[color:var(--t-color)]"
                 style="--t-color: ${team.color}">
                
                <!-- Header -->
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        <div class="text-2xl" style="color: ${team.color}">🛡️</div>
                        <div>
                            <div class="text-white font-bold leading-none">${team.name}</div>
                            <div class="text-[10px] uppercase text-orange-400 font-mono mt-1 border border-orange-400/30 px-1 rounded inline-block">TEAM ${index + 1}</div>
                        </div>
                    </div>
                </div>

                <!-- Info -->
                <div class="mb-4 space-y-1">
                    <div class="flex items-center gap-2 text-gray-400 text-xs">
                        <span>📍</span> ${team.location || 'Unknown'}
                    </div>
                    <div class="flex items-center gap-2 text-gray-500 text-xs font-mono">
                        <span>🖥</span> ${team.ip || '192.168.1.XXX'}
                    </div>
                </div>

                <!-- Stats Grid (Replica of Image) -->
                <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="bg-gray-900/50 rounded p-2 text-center border border-gray-800">
                        <div class="text-blue-400 font-bold text-lg leading-none">${team.members || 5}</div>
                        <div class="text-[8px] text-gray-500 mt-1">MEMBERS</div>
                    </div>
                     <div class="bg-gray-900/50 rounded p-2 text-center border border-gray-800">
                        <div class="text-blue-400 font-bold text-lg leading-none">${team.score}</div>
                        <div class="text-[8px] text-gray-500 mt-1">SCORE</div>
                    </div>
                     <div class="bg-gray-900/50 rounded p-2 text-center border border-gray-800">
                        <div class="text-blue-400 font-bold text-lg leading-none">${team.nodesCaptured}</div>
                        <div class="text-[8px] text-gray-500 mt-1">SOLVED</div>
                    </div>
                </div>

                <!-- Footer Status -->
                <div class="mt-auto flex justify-between items-center text-[10px]">
                    <span class="px-2 py-0.5 rounded-full border border-green-500/30 text-green-400 bg-green-500/10 font-bold">LOW</span>
                    <span class="text-gray-600 font-mono">🕒 Pending: 0 submissions</span>
                </div>
            </div>
            `;
        }).join('');

        // COMBINE INTO MAIN CONTAINER
        this.container.innerHTML = `
            <!-- Header for Dashboard -->
            <div class="flex justify-between items-center mb-2 px-2 shrink-0">
                 <div class="flex items-center gap-2">
                     <span class="text-blue-500">📊</span>
                     <h2 class="text-lg text-white font-bold tracking-wide">LIVE HACKING CTF</h2>
                 </div>
                 <button id="add-team-btn" class="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/50 py-1 px-3 rounded text-xs font-mono uppercase transition-all">
                    + DEPLOY TEAM
                 </button>
            </div>

            <!-- SCROLLABLE AREA -->
            <div class="overflow-y-auto pr-2 flex-1 custom-scrollbar">
                
                <!-- TOP: LIST VIEW -->
                <div class="mb-8">
                    ${listHtml}
                </div>

                <!-- MIDDLE HEADER -->
                <div class="flex items-center gap-2 mb-4 px-1">
                    <span class="text-gray-400">👥</span>
                    <h3 class="text-md text-white font-bold tracking-wide uppercase">Active Cyber Teams</h3>
                </div>

                <!-- BOTTOM: GRID VIEW -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                    ${gridHtml}
                </div>
            </div>
        `;
    }
}
