/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const sessionId = event.cookies.get('sessionid');

	if (sessionId) {
		// Basit session kontrolü - cookie varsa ve doğruysa user = true
		// Gerçek uygulamada daha güvenli bir yöntem kullanılmalı
		event.locals.user = true;
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

