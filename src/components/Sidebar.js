import { registry } from '../core/ServiceRegistry';
import { eventBus } from '../core/EventBus';

export class Sidebar {
    constructor() {
        this.overlay = document.getElementById('sidebar-overlay');
        this.sidebar = document.getElementById('main-sidebar');
        this.toggleBtn = document.getElementById('sidebar-toggle');
        this.closeBtn = document.getElementById('sidebar-close');
        
        // Menu Items
        this.dashboardToggle = document.getElementById('menu-dashboard-toggle');
        this.attackSimBtn = document.getElementById('menu-attack-sim');
        this.fullscreenBtn = document.getElementById('menu-fullscreen');
        this.resetBtn = document.getElementById('menu-reset');

        this.dashboardVisible = true;
    }

    init() {
        this.setupEventListeners();
        console.log('Sidebar Initialized');
    }

    setupEventListeners() {
        // Toggle Sidebar
        this.toggleBtn.addEventListener('click', () => this.open());
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', () => this.close());

        // Menu Actions
        this.dashboardToggle.addEventListener('click', () => {
            const dashboard = document.getElementById('dashboard-container');
            if(dashboard) {
                this.dashboardVisible = !this.dashboardVisible;
                if(this.dashboardVisible) {
                    dashboard.classList.remove('hidden');
                } else {
                    dashboard.classList.add('hidden');
                }
                // Also trigger map resize just in case
                setTimeout(() => {
                   const map = registry.get('MapComponent').map;
                   if(map) map.invalidateSize();
                }, 300);
            }
            this.close();
        });

        this.attackSimBtn.addEventListener('click', () => {
             const nodeService = registry.get('NodeService');
             const nodes = nodeService.getAllNodes();
             if(nodes.length > 1) {
                 const target = nodes[Math.floor(Math.random() * nodes.length)];
                 const attacker = nodes.find(n => n.id !== target.id);
                 
                 eventBus.emit('ATTACK_SIMULATED', { 
                     from: { lat: attacker.lat, lng: attacker.lng }, 
                     to: { lat: target.lat, lng: target.lng } 
                 });
                 
                 alert(`SIMULATION STARTED: ${attacker.name} -> ${target.name}`);
             }
             this.close();
        });

        this.fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                }
            }
            this.close();
        });

        // Admin Controls
        const manageTeamsBtn = document.getElementById('menu-manage-teams');
        if(manageTeamsBtn) {
            manageTeamsBtn.addEventListener('click', () => {
                registry.get('TeamManager').openManager();
                this.close();
            });
        }

        const addNodeBtn = document.getElementById('menu-add-node');
        if(addNodeBtn) {
            addNodeBtn.addEventListener('click', () => {
                registry.get('NodeManager').enableAddMode();
                this.close();
            });
        }

        const dataBackupBtn = document.getElementById('menu-data-backup');
        if(dataBackupBtn) {
            dataBackupBtn.addEventListener('click', () => {
                registry.get('DataManager').openManager();
                this.close();
            });
        }

        const settingsBtn = document.getElementById('menu-settings');
        if(settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                registry.get('SettingsManager').openSettings();
                this.close();
            });
        }

        this.resetBtn.addEventListener('click', () => {
            if(confirm('WARNING: THIS WILL WIPE ALL DATA AND RESTORE NODES TO CAPITAL CITIES. CONTINUE?')) {
                registry.get('StorageService').clear();
                window.location.reload();
            }
        });

        // Listen for Settings Changes to toggle visibility
        eventBus.on('SETTINGS_CHANGED', (settings) => this.applySettings(settings));
        
        // Initial Apply
        setTimeout(() => {
             const settings = registry.get('SettingsManager').settings;
             this.applySettings(settings);
        }, 100);
    }

    applySettings(settings) {
        if(!settings) return;

        // Toggle Attack Sim
        const attackBtn = document.getElementById('menu-attack-sim');
        if(attackBtn) {
            attackBtn.style.display = settings.showAttacks !== false ? 'flex' : 'none';
        }

        // Toggle Admin Controls
        // We need to target the container. The structure is fixed in HTML.
        // "ADMIN CONTROLS" header is an h3, followed by buttons.
        // It's inside a specific div. Let's try to identify it.
        // In index.html, it's: <div class="border-t border-gray-800 py-4 space-y-2"> containing <h3>ADMIN CONTROLS</h3>
        const adminSection = Array.from(document.querySelectorAll('h3')).find(el => el.textContent.includes('ADMIN CONTROLS'));
        if(adminSection) {
            const container = adminSection.parentElement;
            if(container) {
                container.style.display = settings.enableAdmin !== false ? 'block' : 'none';
            }
        }
    }

    open() {
        this.overlay.classList.remove('hidden');
        // Slight delay to allow display:block to apply before opacity transition
        requestAnimationFrame(() => {
            this.overlay.classList.remove('opacity-0');
            this.sidebar.classList.remove('-translate-x-full');
        });
    }

    close() {
        this.sidebar.classList.add('-translate-x-full');
        this.overlay.classList.add('opacity-0');
        
        setTimeout(() => {
            this.overlay.classList.add('hidden');
        }, 300); // Match transition duration
    }
}
