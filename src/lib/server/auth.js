import { getRequestEvent } from '$app/server';
import { redirect, error } from '@sveltejs/kit';

/**
 * @returns {boolean | null}
 */
export function getUser() {
	try {
		const { locals } = getRequestEvent();
		return locals.user ?? null;
	} catch {
		return null;
	}
}

/**
 * @param {string} minRole
 * @returns {boolean}
 */
export function requireAuth() {
	try {
		const { locals, url } = getRequestEvent();

		if (!locals.user) {
			redirect(307, `/admin?redirectTo=${url.pathname}`);
		}

		return true;
	} catch (err) {
		redirect(307, '/admin');
	}
}

