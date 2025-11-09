import { verifyToken } from '$lib/server/jwt';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Build version'ını dosyadan oku (build sırasında oluşturulur)
let BUILD_VERSION = '0';
try {
	const versionPath = resolve(process.cwd(), '.svelte-kit', 'build-version.json');
	const versionData = JSON.parse(readFileSync(versionPath, 'utf-8'));
	BUILD_VERSION = versionData.version || import.meta.env.BUILD_VERSION || Date.now().toString();
} catch {
	// Dosya yoksa environment variable veya timestamp kullan
	BUILD_VERSION = import.meta.env.BUILD_VERSION || Date.now().toString();
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const token = event.cookies.get('sessionid');

	if (token) {
		// JWT token'ı verify et
		const result = await verifyToken(token);

		if (result && result.payload && typeof result.payload === 'object' && 'authenticated' in result.payload && result.payload.authenticated === true) {
			event.locals.user = true;
		} else {
			// Token geçersiz veya expire olmuş, cookie'yi temizle
			event.cookies.delete('sessionid', { path: '/' });
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html, done }) => {
			// HTML'deki tüm script ve link tag'lerine cache busting query parameter ekle
			// Hash'li dosyalara bile version ekle (çift cache busting)
			let transformed = html;
			
			// Script tag'leri için - hash'li olsa bile version ekle
			transformed = transformed.replace(
				/(<script[^>]*src=["']([^"']+)(\?[^"']*)?["'][^>]*>)/gi,
				(match, fullTag, src, existingQuery) => {
					// External script'leri atla
					if (src.startsWith('http')) {
						return fullTag;
					}
					// Zaten version query parameter varsa güncelle, yoksa ekle
					if (existingQuery && existingQuery.includes('v=')) {
						return fullTag.replace(/([?&])v=[^&]*/, `$1v=${BUILD_VERSION}`);
					}
					const separator = existingQuery ? '&' : '?';
					return fullTag.replace(src + (existingQuery || ''), `${src}${existingQuery || ''}${separator}v=${BUILD_VERSION}`);
				}
			);
			
			// Link tag'leri için (CSS) - hash'li olsa bile version ekle
			transformed = transformed.replace(
				/(<link[^>]*href=["']([^"']+)(\?[^"']*)?["'][^>]*rel=["']stylesheet["'][^>]*>)/gi,
				(match, fullTag, href, existingQuery) => {
					// External link'leri atla
					if (href.startsWith('http')) {
						return fullTag;
					}
					// Zaten version query parameter varsa güncelle, yoksa ekle
					if (existingQuery && existingQuery.includes('v=')) {
						return fullTag.replace(/([?&])v=[^&]*/, `$1v=${BUILD_VERSION}`);
					}
					const separator = existingQuery ? '&' : '?';
					return fullTag.replace(href + (existingQuery || ''), `${href}${existingQuery || ''}${separator}v=${BUILD_VERSION}`);
				}
			);
			
			// HTML'e version meta tag ekle (sadece son chunk'ta)
			if (done && !transformed.includes('data-build-version')) {
				transformed = transformed.replace(
					/<head[^>]*>/i,
					`$&<meta name="build-version" content="${BUILD_VERSION}" data-build-version="true">`
				);
			}
			
			return transformed;
		}
	});
	
	// Cache'i tamamen devre dışı bırak - tüm olası cache mekanizmaları için
	response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
	response.headers.set('Pragma', 'no-cache');
	response.headers.set('Expires', '0');
	response.headers.set('Surrogate-Control', 'no-store');
	
	// Browser ve CDN cache'ini zorla invalidate etmek için
	// Her request'te değişen bir değer (browser cache'ini zorla temizler)
	response.headers.set('X-Cache-Bust', BUILD_VERSION);
	
	// ETag ve Last-Modified header'larını kaldır (eğer varsa)
	// Bu header'lar browser'ın conditional request yapmasına neden olur
	response.headers.delete('ETag');
	response.headers.delete('Last-Modified');
	
	return response;
}

