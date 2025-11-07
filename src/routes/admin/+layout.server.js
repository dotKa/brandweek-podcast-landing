import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals, url }) {
	if (!locals.user && url.pathname !== '/admin') {
		redirect(303, '/admin');
	}
	return {};
}

