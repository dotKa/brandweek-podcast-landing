import { json, error } from '@sveltejs/kit';
import { S3Client, UploadPartCommand } from '@aws-sdk/client-s3';

const aws = {
	baseUrl: 's3.gridstudio.ai',
	bucket: 'app-gridstudio',
	region: 'us-east-1',
	accessKeyId: 'app-gridstudio',
	secretAccessKey: 'EB2RVnzzl4exgMnI7Sb4YueO7bFvFWxY'
};

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		if (!locals.user) {
			error(401, 'Authentication required');
		}

		const data = await request.json();
		const { uploadId, partNumber, chunkBase64, fileName } = data;

		if (!uploadId || !partNumber || !chunkBase64 || !fileName) {
			error(400, 'uploadId, partNumber, chunkBase64 ve fileName gereklidir');
		}

		const { baseUrl, accessKeyId, secretAccessKey, region, bucket } = aws;

		const awsOptions = {
			credentials: {
				accessKeyId,
				secretAccessKey
			},
			region
		};

		if (baseUrl) {
			// @ts-ignore
			awsOptions.endpoint = `https://${baseUrl}`;
			// @ts-ignore
			awsOptions.forcePathStyle = true;
		}

		const s3Client = new S3Client(awsOptions);
		const path = `bw-landing/${new Date().getFullYear()}/${fileName}`;

		// Base64'ten Buffer'a çevir
		let actualBase64 = chunkBase64;
		if (chunkBase64.includes(',')) {
			actualBase64 = chunkBase64.split(',')[1];
		}
		const chunkBuffer = Buffer.from(actualBase64, 'base64');

		const command = new UploadPartCommand({
			Bucket: bucket,
			Key: path,
			UploadId: uploadId,
			PartNumber: partNumber,
			Body: chunkBuffer
		});

		const response = await s3Client.send(command);
		console.log(`[Upload Chunk] Part ${partNumber} yüklendi - ETag: ${response.ETag}`);

		return json({ etag: response.ETag });
	} catch (err) {
		console.error(`[Upload Chunk] Part ${partNumber} hatası:`, err);
		const errorMessage = err instanceof Error ? err.message : 'Chunk yüklenemedi';
		error(500, errorMessage);
	}
}

