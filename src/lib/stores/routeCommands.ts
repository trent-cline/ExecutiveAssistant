import { writable } from 'svelte/store';
import type { VoiceCommand as BaseVoiceCommand } from './voiceCommands';

// Extended VoiceCommand interface with icon property
export interface VoiceCommand extends BaseVoiceCommand {
    icon?: string;
}

// Interface for route information
export interface RouteInfo {
    path: string;          // Full path (e.g., '/company/team')
    name: string;          // Last segment (e.g., 'team')
    parent?: string;       // Parent segment if exists (e.g., 'company')
    fullName: string;      // Human-readable name (e.g., 'Company Team')
    synonyms: string[];    // Alternative ways to refer to this route
}

// Store for all available routes
export const availableRoutes = writable<RouteInfo[]>([]);

// Store for route-based voice commands
export const routeCommands = writable<VoiceCommand[]>([]);

// Define route synonyms and friendly names
const routeSynonyms: Record<string, string[]> = {
    '': ['home', 'main page', 'landing page', 'front page'],
    'voice-nav': ['voice navigation', 'voice commands', 'voice control'],
    'table': ['brain inbox', 'inbox', 'brain', 'notes'],
    'private-notes': ['private notes', 'my notes', 'personal notes'],
    'prm': ['relationships', 'contacts', 'people', 'relationship management'],
    'company': ['pillar apps', 'pillar', 'company dashboard', 'company page'],
    'goals': ['my goals', 'goal list', 'objectives'],
    'shopping': ['shopping list', 'buy list', 'purchases', 'shopping items'],
    'dlltw': ['dlltw notes', 'book notes', 'reading notes'],
    'lists': ['my lists', 'list collection', 'all lists'],
    'login': ['sign in', 'log in page', 'authentication'],
    'projects': ['active projects', 'project list', 'all projects'],
    'team': ['company team', 'team members', 'staff', 'employees'],
    'funding': ['company funding', 'investors', 'investment', 'fundraising'],
    'cloud-costs': ['cloud costs', 'aws costs', 'cloud spending', 'infrastructure costs'],
    'info': ['company info', 'company information', 'about company', 'company details'],
    'organization-chart': ['org chart', 'organization chart', 'company structure', 'hierarchy'],
    'pressure-calculator': ['pressure calculator', 'calculator', 'pressure tool'],
    'structure': ['company structure', 'organization structure', 'corporate structure']
};

// Define friendly names for routes
const routeFriendlyNames: Record<string, string> = {
    '': 'Home',
    'voice-nav': 'Voice Navigation',
    'table': 'Brain Inbox',
    'private-notes': 'Private Notes',
    'prm': 'Relationships',
    'company': 'Pillar Apps',
    'goals': 'Goals',
    'shopping': 'Shopping List',
    'dlltw': 'DLLTW Notes',
    'lists': 'Lists',
    'login': 'Login',
    'projects': 'Projects',
    'team': 'Team',
    'funding': 'Funding',
    'cloud-costs': 'Cloud Costs',
    'info': 'Company Info',
    'organization-chart': 'Organization Chart',
    'pressure-calculator': 'Pressure Calculator',
    'structure': 'Company Structure'
};

// Icons for different route types
const routeIcons: Record<string, string> = {
    '': 'fa-home',
    'voice-nav': 'fa-microphone-alt',
    'table': 'fa-brain',
    'private-notes': 'fa-envelope',
    'prm': 'fa-address-book',
    'company': 'fa-building',
    'goals': 'fa-bullseye',
    'shopping': 'fa-shopping-cart',
    'dlltw': 'fa-book',
    'lists': 'fa-list',
    'login': 'fa-sign-in-alt',
    'projects': 'fa-tasks',
    'team': 'fa-users',
    'funding': 'fa-money-bill-wave',
    'cloud-costs': 'fa-cloud',
    'info': 'fa-info-circle',
    'organization-chart': 'fa-sitemap',
    'pressure-calculator': 'fa-calculator',
    'structure': 'fa-project-diagram'
};

/**
 * Extract route information from a list of file paths
 * @param paths Array of file paths to extract routes from
 */
export function extractRoutes(paths: string[]): RouteInfo[] {
    const routes: RouteInfo[] = [];
    
    // Process each path to extract route information
    paths.forEach(path => {
        // Skip dynamic routes with [parameters] for voice navigation
        if (path.includes('[') && path.includes(']')) {
            return;
        }
        
        // Convert Windows path to URL path
        const urlPath = path
            .replace(/\\/g, '/')
            .replace(/\+page\.svelte$/, '')
            .replace(/\/+$/, '');
        
        // Skip routes that don't represent pages
        if (urlPath.includes('+layout') || urlPath.includes('+error')) {
            return;
        }
        
        // Extract route segments
        const segments = urlPath.split('/').filter(Boolean);
        const name = segments.length > 0 ? segments[segments.length - 1] : '';
        const parent = segments.length > 1 ? segments[segments.length - 2] : undefined;
        
        // Create friendly name
        const friendlyName = routeFriendlyNames[name] || 
                            name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        // Get synonyms for this route
        const synonyms = routeSynonyms[name] || [];
        
        // Add parent name to synonyms for nested routes
        if (parent && parent !== 'routes') {
            const parentFriendly = routeFriendlyNames[parent] || 
                                parent.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            synonyms.push(`${parentFriendly} ${friendlyName}`);
            
            // Add parent synonyms combined with this route
            if (routeSynonyms[parent]) {
                routeSynonyms[parent].forEach(parentSynonym => {
                    synonyms.push(`${parentSynonym} ${friendlyName.toLowerCase()}`);
                });
            }
        }
        
        // Create route info object
        routes.push({
            path: `/${segments.join('/')}`,
            name,
            parent,
            fullName: friendlyName,
            synonyms
        });
    });
    
    return routes;
}

/**
 * Generate voice commands from route information
 * @param routes Array of route information objects
 */
export function generateRouteCommands(routes: RouteInfo[]): VoiceCommand[] {
    return routes.map(route => {
        // Determine the appropriate icon
        const icon = route.name in routeIcons 
            ? routeIcons[route.name] 
            : (route.parent && route.parent in routeIcons 
                ? routeIcons[route.parent] 
                : 'fa-link');
        
        // Create the command
        return {
            command: `Show ${route.fullName.toLowerCase()}`,
            description: `Navigate to ${route.fullName}`,
            route: route.path,
            icon: icon
        };
    });
}

/**
 * Match a spoken command to a route using regex patterns
 * @param command The spoken command to match
 * @param routes Array of route information
 */
export function matchRouteCommand(command: string, routes: RouteInfo[]): RouteInfo | null {
    // Normalize the command
    const normalizedCommand = command.toLowerCase().trim();
    
    // Regex 1: Match exact page names
    const exactRouteNames = routes.map(r => r.name);
    const exactRegex = new RegExp(`\\b(${exactRouteNames.join('|')})\\b`, 'i');
    const exactMatch = normalizedCommand.match(exactRegex);
    
    if (exactMatch) {
        const matchedRoute = routes.find(r => r.name === exactMatch[1].toLowerCase());
        if (matchedRoute) return matchedRoute;
    }
    
    // Regex 2: Match synonyms or related phrases
    for (const route of routes) {
        for (const synonym of route.synonyms) {
            if (normalizedCommand.includes(synonym.toLowerCase())) {
                return route;
            }
        }
    }
    
    // Regex 3: Match subpages or nested routes
    const subrouteNames = routes
        .filter(r => r.parent)
        .map(r => r.name);
    
    const subrouteRegex = new RegExp(`\\b(${subrouteNames.join('|')})\\b`, 'i');
    const subrouteMatch = normalizedCommand.match(subrouteRegex);
    
    if (subrouteMatch) {
        const matchedRoute = routes.find(r => r.name === subrouteMatch[1].toLowerCase());
        if (matchedRoute) return matchedRoute;
    }
    
    // No match found
    return null;
}

/**
 * Initialize the route commands system with a list of file paths
 * @param paths Array of file paths to extract routes from
 */
export function initializeRouteCommands(paths: string[]): void {
    const routes = extractRoutes(paths);
    availableRoutes.set(routes);
    
    const commands = generateRouteCommands(routes);
    routeCommands.set(commands);
}
