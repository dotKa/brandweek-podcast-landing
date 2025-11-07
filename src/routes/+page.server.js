/** @type {import('./$types').PageServerLoad} */
export async function load({ fetch }) {
	try {
		const response = await fetch('/api/sessions');
		const sessions = await response.json();
		return {
			sessions
		};
	} catch (error) {
		console.error('Error loading sessions:', error);
		return {
			sessions: []
		};
	}
}

