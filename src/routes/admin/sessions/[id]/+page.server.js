import { redirect, error } from '@sveltejs/kit';
import * as sessionsData from '$lib/server/data/sessions.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params, locals }) {
	if (!locals.user) {
		redirect(303, '/admin');
	}

	const isNew = params.id === 'new';
	let session = null;

	if (!isNew) {
		session = sessionsData.getSessionById(params.id);
		if (!session) {
			error(404, 'Session not found');
		}
	}

	return {
		session,
		isNew
	};
}

/** @satisfies {import('./$types').Actions} */
export const actions = {
	save: async ({ request, params, locals }) => {
		if (!locals.user) {
			return { error: 'Unauthorized' };
		}

		const data = await request.formData();
		const isNew = params.id === 'new';

		const speakersArray = data.getAll('speakers');
		const speakers = speakersArray
			.map(s => s.toString().trim())
			.filter(s => s.length > 0);

		const sessionData = {
			day: Number(data.get('day')),
			title: data.get('title')?.toString() || '',
			duration: Number(data.get('duration')) || 0,
			date: data.get('date')?.toString() || '',
			audioUrl: data.get('audioUrl')?.toString() || '',
			summary: data.get('summary')?.toString() || '',
			active: data.get('active') === 'on',
			order: Number(data.get('order')) || 0,
			speakers: speakers.length > 0 ? speakers : undefined
		};

		if (!sessionData.title || !sessionData.day) {
			return { error: 'Başlık ve gün gereklidir' };
		}

		if (isNew) {
			const newSession = sessionsData.createSession(sessionData);
			return { success: true, session: newSession };
		} else {
			const updatedSession = sessionsData.updateSession(params.id, sessionData);
			if (!updatedSession) {
				return { error: 'Session not found' };
			}
			return { success: true, session: updatedSession };
		}
	}
};

