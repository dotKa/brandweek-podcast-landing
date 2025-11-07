import { json, error } from '@sveltejs/kit';
import * as sessionsData from '$lib/server/data/sessions.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ url }) {
	try {
		const day = url.searchParams.get('day');
		let sessions = sessionsData.getSessions();

		// Aktif session'ları filtrele
		sessions = sessions.filter((s) => s.active);

		// Gün filtresi varsa uygula
		if (day) {
			sessions = sessions.filter((s) => s.day === Number(day));
		}

		// Sıralama
		sessions.sort((a, b) => a.order - b.order);

		return json(sessions, {
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (err) {
		console.error('Error fetching sessions:', err);
		error(500, 'Failed to fetch sessions');
	}
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		// Auth kontrolü
		if (!locals.user) {
			error(401, 'Authentication required');
		}

		const data = await request.json();

		// Validation
		if (!data.title || !data.day) {
			error(400, 'Title and day are required');
		}

		const newSession = sessionsData.createSession({
			day: data.day,
			title: data.title,
			duration: data.duration || 0,
			date: data.date || '',
			audioUrl: data.audioUrl || '',
			summary: data.summary || '',
			active: data.active !== undefined ? data.active : true,
			order: data.order || 0
		});

		return json(newSession, {
			status: 201,
			headers: {
				'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
				'Pragma': 'no-cache',
				'Expires': '0'
			}
		});
	} catch (err) {
		if (err.status) {
			throw err;
		}
		console.error('Error creating session:', err);
		error(500, 'Failed to create session');
	}
}

