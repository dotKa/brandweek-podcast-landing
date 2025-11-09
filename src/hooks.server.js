import { verifyToken } from '$lib/server/jwt';

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const token = event.cookies.get('sessionid');

	if (token) {
		// JWT token'ı verify et
		const result = await verifyToken(token);

		if (result && result.payload.authenticated === true) {
			event.locals.user = true;
		} else {
			// Token geçersiz veya expire olmuş, cookie'yi temizle
			event.cookies.delete('sessionid', { path: '/' });
			event.locals.user = null;
		}
	} else {
		event.locals.user = null;
	}

	const response = await resolve(event);
	
	// Cache'i tamamen devre dışı bırak - tüm olası cache mekanizmaları için
	response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
	response.headers.set('Pragma', 'no-cache');
	response.headers.set('Expires', '0');
	response.headers.set('Surrogate-Control', 'no-store');
	
	// Browser ve CDN cache'ini zorla invalidate etmek için
	// Her request'te değişen bir değer (browser cache'ini zorla temizler)
	response.headers.set('X-Cache-Bust', Date.now().toString());
	
	// ETag ve Last-Modified header'larını kaldır (eğer varsa)
	// Bu header'lar browser'ın conditional request yapmasına neden olur
	response.headers.delete('ETag');
	response.headers.delete('Last-Modified');
	
	return response;
}

