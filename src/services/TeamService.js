import { registry } from '../core/ServiceRegistry';
import { eventBus } from '../core/EventBus';

export class TeamService {
    constructor() {
        this.teams = [];
        this.storage = null;
    }

    init() {
        this.storage = registry.get('StorageService');
        this.teams = this.storage.get('teams', this.getDefaultTeams());
        console.log('TeamService initialized', this.teams);
        
        // Listen for Node Captures to update stats automatically
        eventBus.on('NODE_CAPTURED', (data) => this.processNodeCapture(data));
    }

    processNodeCapture(data) {
        const { node, teamId, oldOwner } = data;

        // 1. Reward New Owner
        const newOwner = this.getTeam(teamId);
        if (newOwner) {
            newOwner.nodesCaptured = (newOwner.nodesCaptured || 0) + 1;
            newOwner.score += node.points;
        }

        // 2. Penalize Old Owner (if any)
        if (oldOwner) {
            const previousOwner = this.getTeam(oldOwner);
            if (previousOwner && previousOwner.nodesCaptured > 0) {
                previousOwner.nodesCaptured -= 1;
            }
        }

        // 3. Save & Notify
        this.save();
        eventBus.emit('TEAM_UPDATED'); // Generic update to refresh all
    }

    getDefaultTeams() {
        return [
            { id: 1, name: 'Team Alpha', color: '#00ff9d', score: 0, nodesCaptured: 0, ip: '192.168.1.101', location: 'Tokyo, Japan' },
            { id: 2, name: 'Team Beta', color: '#7000ff', score: 0, nodesCaptured: 0, ip: '192.168.1.102', location: 'San Francisco, USA' },
            { id: 3, name: 'Team Gamma', color: '#ff0055', score: 0, nodesCaptured: 0, ip: '192.168.1.103', location: 'Berlin, Germany' },
            { id: 4, name: 'Team Delta', color: '#00f7ff', score: 0, nodesCaptured: 0, ip: '192.168.1.104', location: 'Singapore' }
        ];
    }

    getAllTeams() {
        return this.teams;
    }

    getTeam(id) {
        return this.teams.find(t => t.id === id);
    }

    addTeam(name, color) {
        const newTeam = {
            id: Date.now(),
            name,
            color,
            score: 0,
            nodesCaptured: 0,
            ip: `192.168.1.${100 + this.teams.length + 1}`,
            location: 'Unknown Location'
        };
        this.teams.push(newTeam);
        this.save();
        eventBus.emit('TEAM_ADDED', newTeam);
        return newTeam;
    }

    updateScore(teamId, points) {
        const team = this.getTeam(teamId);
        if (team) {
            team.score += points;
            this.save();
            eventBus.emit('TEAM_UPDATED', team);
        }
    }

    updateTeam(id, data) {
        const index = this.teams.findIndex(t => t.id === id);
        if (index !== -1) {
            this.teams[index] = { ...this.teams[index], ...data };
            this.save();
            eventBus.emit('TEAM_UPDATED', this.teams[index]);
            return this.teams[index];
        }
        return null;
    }

    deleteTeam(id) {
        this.teams = this.teams.filter(t => t.id !== id);
        this.save();
        eventBus.emit('TEAM_DELETED', id);
        eventBus.emit('TEAM_UPDATED'); // To refresh lists
    }    

    save() {
        this.storage.save('teams', this.teams);
    }

    // Data I/O
    importData(data) {
        if (Array.isArray(data)) {
            this.teams = data;
            this.save();
            eventBus.emit('TEAM_UPDATED'); // Refresh all
            return true;
        }
        return false;
    }

    exportData() {
        return JSON.stringify(this.teams, null, 2);
    }
}
