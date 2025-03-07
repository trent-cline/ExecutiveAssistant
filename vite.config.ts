import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { join } from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		skeleton({
			themes: {
				preset: [
					{
						name: 'modern',
						enhancements: true,
					},
				],
			},
		}),
	]
});
