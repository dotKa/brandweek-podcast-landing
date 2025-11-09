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
	
	// Cache'i devre dışı bırak
	response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
	response.headers.set('Pragma', 'no-cache');
	response.headers.set('Expires', '0');
	response.headers.set('Surrogate-Control', 'no-store');
	
	return response;
}

