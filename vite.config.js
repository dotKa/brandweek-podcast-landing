import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			name: 'generate-build-version',
			buildStart() {
				// Build başladığında version oluştur
				const version = Date.now().toString();
				const versionDir = resolve(process.cwd(), '.svelte-kit');
				const versionPath = resolve(versionDir, 'build-version.json');
				
				// Dizin yoksa oluştur
				try {
					mkdirSync(versionDir, { recursive: true });
				} catch {
					// Dizin zaten varsa hata verme
				}
				
				// Version dosyasını yaz
				writeFileSync(versionPath, JSON.stringify({ version }), 'utf-8');
			}
		}
	],
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

