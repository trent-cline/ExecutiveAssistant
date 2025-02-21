import { writable } from 'svelte/store';

export interface VoiceCommand {
    command: string;
    description: string;
    route?: string;
    component?: string;
    action?: () => void;
}

interface ComponentCommands {
    [key: string]: VoiceCommand[];
}

// Base navigation commands
export const navigationCommands: VoiceCommand[] = [
    { command: 'projects', description: 'Go to Projects page', route: '/projects' },
    { command: 'goals', description: 'Go to Goals page', route: '/goals' },
    { command: 'shopping', description: 'Go to Shopping List', route: '/shopping' },
    { command: 'brain', description: 'Go to Brain Inbox', route: '/table' },
    { command: 'notes', description: 'Go to Brain Inbox', route: '/table' },
    { command: 'private', description: 'Go to Private Notes', route: '/private-notes' },
    { command: 'dlltw', description: 'Go to DLLTW Notes', route: '/dlltw' },
    { command: 'company', description: 'Go to Company page', route: '/company' }
];

// Component-specific commands
export const componentCommands: ComponentCommands = {
    'brain-inbox': [
        { command: 'add note', description: 'Create a new note', route: '/table/new' },
        { command: 'show completed', description: 'Show completed notes', action: () => {} },
    ],
    'goals': [
        { command: 'add goal', description: 'Create a new goal', action: () => {} },
        { command: 'show active', description: 'Show active goals', action: () => {} },
    ],
    'shopping': [
        { command: 'add item', description: 'Add new shopping item', action: () => {} },
        { command: 'clear list', description: 'Clear completed items', action: () => {} },
    ],
};

// Store for currently available commands based on loaded component
export const activeCommands = writable<VoiceCommand[]>(navigationCommands);

// Store for currently loaded component
export const activeComponent = writable<string | null>(null);

// Update available commands when component changes
activeComponent.subscribe((component) => {
    if (component && componentCommands[component]) {
        activeCommands.set([...navigationCommands, ...componentCommands[component]]);
    } else {
        activeCommands.set(navigationCommands);
    }
});
