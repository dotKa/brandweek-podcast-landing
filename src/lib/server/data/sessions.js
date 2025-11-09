import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Production'da /app/data/sessions.json, development'ta source içinde
// Environment variable ile override edilebilir
const SESSIONS_FILE = process.env.SESSIONS_FILE_PATH || 
	(import.meta.env.PROD ? '/app/data/sessions.json' : join(__dirname, 'sessions.json'));

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
		// Dosya yoksa dizini oluştur
		const dir = dirname(SESSIONS_FILE);
		try {
			writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
		} catch (dirError) {
			// Dizin yoksa oluştur
			if (dirError.code === 'ENOENT') {
				mkdirSync(dir, { recursive: true });
				writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
			} else {
				throw dirError;
			}
		}
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

