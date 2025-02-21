import { writable } from 'svelte/store';

export interface ComponentCommand {
    command: string;
    description: string;
    icon: string;
    iconColor: string;
}

export interface ComponentCommands {
    title: string;
    commands: ComponentCommand[];
}

export const componentCommands = writable<ComponentCommands | null>(null);

// Predefined component commands
export const commandSets: Record<string, ComponentCommands> = {
    'brain-inbox': {
        title: 'Brain Inbox Commands',
        commands: [
            { 
                command: 'Add new note',
                description: 'Create a new note in the brain inbox',
                icon: 'fa-plus-circle',
                iconColor: 'text-blue-500'
            },
            { 
                command: 'Show completed',
                description: 'Display completed notes',
                icon: 'fa-check-circle',
                iconColor: 'text-green-500'
            }
        ]
    },
    'goals': {
        title: 'Goals Commands',
        commands: [
            { 
                command: 'Add new goal',
                description: 'Create a new goal',
                icon: 'fa-plus-circle',
                iconColor: 'text-blue-500'
            },
            { 
                command: 'Show active goals',
                description: 'Display active goals only',
                icon: 'fa-bullseye',
                iconColor: 'text-green-500'
            }
        ]
    },
    'shopping': {
        title: 'Shopping List Commands',
        commands: [
            { 
                command: 'Add item',
                description: 'Add a new shopping item',
                icon: 'fa-cart-plus',
                iconColor: 'text-blue-500'
            },
            { 
                command: 'Clear completed',
                description: 'Remove completed items',
                icon: 'fa-trash-alt',
                iconColor: 'text-red-500'
            }
        ]
    }
};
