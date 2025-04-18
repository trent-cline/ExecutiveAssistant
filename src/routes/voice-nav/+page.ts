// Client-side only page
export const ssr = false;
export const prerender = false;

// No redirects, just load the page
export function load() {
    return {
        // Empty data object, authentication will be handled client-side
    };
}
