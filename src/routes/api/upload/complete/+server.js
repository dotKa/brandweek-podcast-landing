import { json, error } from '@sveltejs/kit';
import { S3Client, CompleteMultipartUploadCommand } from '@aws-sdk/client-s3';

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
		const { uploadId, parts, fileName } = data;

		if (!uploadId || !parts || !Array.isArray(parts) || !fileName) {
			error(400, 'uploadId, parts (array) ve fileName gereklidir');
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

		const command = new CompleteMultipartUploadCommand({
			Bucket: bucket,
			Key: path,
			UploadId: uploadId,
			MultipartUpload: {
				// @ts-ignore
				Parts: parts.map((part) => ({
					ETag: part.etag,
					PartNumber: part.partNumber
				}))
			}
		});

		const response = await s3Client.send(command);
		console.log(`[Upload Complete] Upload tamamlandı - Location: ${response.Location}`);

		return json({ url: response.Location });
	} catch (err) {
		console.error('[Upload Complete] Error:', err);
		const errorMessage = err instanceof Error ? err.message : 'Upload tamamlanamadı';
		error(500, errorMessage);
	}
}

