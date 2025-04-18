import { writable } from 'svelte/store';

// Define types for API logs
export interface ApiLogEntry {
    id: string;
    timestamp: string;
    endpoint: string;
    requestData: any;
    responseData: any;
    duration: number;
    status: 'success' | 'error';
    error?: string;
}

// Create a store to hold the API logs
export const apiLogs = writable<ApiLogEntry[]>([]);

// Function to add a new log entry
export function logApiCall(entry: Omit<ApiLogEntry, 'id' | 'timestamp'>) {
    const id = Date.now().toString();
    const timestamp = new Date().toISOString();
    
    apiLogs.update(logs => {
        // Keep only the last 100 logs to prevent memory issues
        const updatedLogs = [{ ...entry, id, timestamp }, ...logs];
        return updatedLogs.slice(0, 100);
    });
    
    return id;
}

// Function to clear logs
export function clearApiLogs() {
    apiLogs.set([]);
}

// Function to export logs as JSON
export function exportApiLogs() {
    let logs: ApiLogEntry[] = [];
    apiLogs.subscribe(value => {
        logs = value;
    })();
    
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `api-logs-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}
