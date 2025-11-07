import { json, error } from '@sveltejs/kit';
import { ADMIN_USER, ADMIN_PASSWORD } from '$env/static/private';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	try {
		const data = await request.json();
		const { username, password } = data;

		if (!username || !password) {
			error(400, 'Username and password are required');
		}

		if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
			// Session cookie set et
			cookies.set('sessionid', 'authenticated', {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7 // 7 gün
			});

			return json({ success: true });
		} else {
			error(401, 'Invalid credentials');
		}
	} catch (err) {
		if (err.status) {
			throw err;
		}
		error(500, 'Internal server error');
	}
}

