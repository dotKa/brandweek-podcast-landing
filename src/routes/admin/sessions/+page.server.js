import { redirect } from '@sveltejs/kit';
import * as sessionsData from '$lib/server/data/sessions.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, fetch }) {
	if (!locals.user) {
		redirect(303, '/admin');
	}

	const sessions = sessionsData.getSessions();
	return {
		sessions
	};
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) {
			return { error: 'Unauthorized' };
		}

		const data = await request.formData();
		const id = data.get('id');

		if (!id) {
			return { error: 'ID is required' };
		}

		const deleted = sessionsData.deleteSession(Number(id));
		if (!deleted) {
			return { error: 'Session not found' };
		}

		return { success: true };
	}
};

