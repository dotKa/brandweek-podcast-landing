import { redirect, fail } from '@sveltejs/kit';
import { ADMIN_USER, ADMIN_PASSWORD } from '$env/static/private';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	if (locals.user) {
		redirect(303, '/admin/sessions');
	}
	return {};
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username');
		const password = data.get('password');

		if (!username || !password) {
			return fail(400, { error: 'Kullanıcı adı ve şifre gereklidir' });
		}

		if (username === ADMIN_USER && password === ADMIN_PASSWORD) {
			cookies.set('sessionid', 'authenticated', {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				secure: process.env.NODE_ENV === 'production',
				maxAge: 60 * 60 * 24 * 7 // 7 gün
			});

			return { success: true };
		} else {
			return fail(401, { error: 'Geçersiz kullanıcı adı veya şifre' });
		}
	}
};

