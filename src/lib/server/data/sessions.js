import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SESSIONS_FILE = join(__dirname, 'sessions.json');

/**
 * @typedef {Object} Session
 * @property {number} id
 * @property {1|2|3} day
 * @property {string} title
 * @property {number} duration
 * @property {string} date
 * @property {string} audioUrl
 * @property {string} summary
 * @property {boolean} active
 * @property {number} order
 */

/**
 * @returns {Session[]}
 */
export function getSessions() {
	try {
		const data = readFileSync(SESSIONS_FILE, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		console.error('Error reading sessions:', error);
		return [];
	}
}

/**
 * @param {Session[]} sessions
 */
export function saveSessions(sessions) {
	try {
		writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
		return true;
	} catch (error) {
		console.error('Error saving sessions:', error);
		return false;
	}
}

/**
 * @param {number} id
 * @returns {Session | null}
 */
export function getSessionById(id) {
	const sessions = getSessions();
	return sessions.find((s) => s.id === Number(id)) || null;
}

/**
 * @param {Session} session
 * @returns {Session}
 */
export function createSession(session) {
	const sessions = getSessions();
	const newId = sessions.length > 0 ? Math.max(...sessions.map((s) => s.id)) + 1 : 1;
	const newSession = { ...session, id: newId };
	sessions.push(newSession);
	saveSessions(sessions);
	return newSession;
}

/**
 * @param {number} id
 * @param {Partial<Session>} updates
 * @returns {Session | null}
 */
export function updateSession(id, updates) {
	const sessions = getSessions();
	const index = sessions.findIndex((s) => s.id === Number(id));
	if (index === -1) return null;

	sessions[index] = { ...sessions[index], ...updates };
	saveSessions(sessions);
	return sessions[index];
}

/**
 * @param {number} id
 * @returns {boolean}
 */
export function deleteSession(id) {
	const sessions = getSessions();
	const index = sessions.findIndex((s) => s.id === Number(id));
	if (index === -1) return false;

	sessions.splice(index, 1);
	saveSessions(sessions);
	return true;
}

