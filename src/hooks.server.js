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

	return resolve(event);
}

