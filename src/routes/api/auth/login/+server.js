import { json, error } from '@sveltejs/kit';
import { ADMIN_USER, ADMIN_PASSWORD } from '$env/static/private';
import { createToken } from '$lib/server/jwt';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const data = await request.json();
		const { username, password } = data;

		if (!username || !password) {
			error(400, 'Username and password are required');
		}

		if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
			// JWT token oluştur
			const token = await createToken();

			// JWT token'ı cookie'ye set et
			cookies.set('sessionid', token, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: import.meta.env.PROD,
				maxAge: 60 * 60 * 24 * 7 // 7 gün
			});

			return json({ success: true }, {
				headers: {
					'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
					'Pragma': 'no-cache',
					'Expires': '0'
				}
			});
		} else {
			error(401, 'Invalid credentials');
		}
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		error(500, 'Internal server error');
	}
}

