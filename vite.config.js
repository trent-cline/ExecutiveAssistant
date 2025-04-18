import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

/** @type {import('vite').UserConfig} */
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [sveltekit()],
    
    // Expose all environment variables to the client
    define: {
      'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY)
    },
    
    // Use default server options
    
    // Build options
    build: {
      outDir: 'build',
      emptyOutDir: true,
    }
  };
});
