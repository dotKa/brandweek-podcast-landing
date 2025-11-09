import { json } from '@sveltejs/kit';

/** @type {import('./$types').RequestHandler} */
export async function POST({ cookies }) {
	// Cookie'yi temizle
	cookies.delete('sessionid', {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: import.meta.env.PROD
	});

	return json({ success: true }, {
		headers: {
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
			'Pragma': 'no-cache',
			'Expires': '0'
		}
	});
}

