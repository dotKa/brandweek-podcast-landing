import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		allowedHosts: ['bw-podcast.dotka.xyz']
	},
	build: {
		// Build cache'ini devre dışı bırak
		rollupOptions: {
			output: {
				// Cache busting için hash ekle
				entryFileNames: '[name]-[hash].js',
				chunkFileNames: '[name]-[hash].js',
				assetFileNames: '[name]-[hash].[ext]'
			}
		}
	},
	// Vite cache'ini devre dışı bırak
	cacheDir: '.vite-cache'
});

