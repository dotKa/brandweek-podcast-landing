import { json, error } from '@sveltejs/kit';
import * as sessionsData from '$lib/server/data/sessions.js';

/** @type {import('./$types').RequestHandler} */
export async function GET({ params, locals }) {
	try {
		const cacheHeaders = {
			'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
			'Pragma': 'no-cache',
			'Expires': '0'
		};

		// Auth kontrolü (admin için)
		if (locals.user) {
			const session = sessionsData.getSessionById(params.id);
			if (!session) {
				error(404, 'Session not found');
			}
			return json(session, { headers: cacheHeaders });
		}

		// Public erişim - sadece aktif session'lar
		const session = sessionsData.getSessionById(params.id);
		if (!session || !session.active) {
			error(404, 'Session not found');
		}
		return json(session, { headers: cacheHeaders });
	} catch (err) {
		if (err.status) {
			throw err;
		}
		console.error('Error fetching session:', err);
		error(500, 'Failed to fetch session');
	}
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request, locals }) {
	try {
		// Auth kontrolü
		if (!locals.user) {
			error(401, 'Authentication required');
		}

		const data = await request.json();
		const updatedSession = sessionsData.updateSession(params.id, data);

		if (!updatedSession) {
			error(404, 'Session not found');
		}

		return json(updatedSession, {
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
		console.error('Error updating session:', err);
		error(500, 'Failed to update session');
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, locals }) {
	try {
		// Auth kontrolü
		if (!locals.user) {
			error(401, 'Authentication required');
		}

		const deleted = sessionsData.deleteSession(params.id);

		if (!deleted) {
			error(404, 'Session not found');
		}

		return json({ success: true }, {
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
		console.error('Error deleting session:', err);
		error(500, 'Failed to delete session');
	}
}

