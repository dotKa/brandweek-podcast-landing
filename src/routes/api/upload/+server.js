import { json, error } from '@sveltejs/kit';
import { uploadBase64File } from '$lib/server/uploader.js';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		// Auth kontrolü
		if (!locals.user) {
			error(401, 'Authentication required');
		}

		const data = await request.json();
		const { base64Data, mimeType, fileName } = data;

		if (!base64Data || !mimeType || !fileName) {
			error(400, 'base64Data, mimeType ve fileName gereklidir');
		}

		console.log('[Upload] Starting upload:', { fileName, mimeType, dataLength: base64Data.length });

		// Dosya yükle
		const fileUrl = await uploadBase64File(base64Data, mimeType, fileName);

		console.log('[Upload] Upload successful:', fileUrl);

		return json({ url: fileUrl }, {
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
		console.error('[Upload] Error:', err);
		const errorMessage = err instanceof Error ? err.message : 'Dosya yüklenemedi';
		error(500, errorMessage);
	}
}

