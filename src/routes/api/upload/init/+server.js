import { json, error } from '@sveltejs/kit';
import { S3Client, CreateMultipartUploadCommand } from '@aws-sdk/client-s3';

const aws = {
	baseUrl: 's3.gridstudio.ai',
	bucket: 'app-gridstudio',
	region: 'us-east-1',
	accessKeyId: 'app-gridstudio',
	secretAccessKey: 'EB2RVnzzl4exgMnI7Sb4YueO7bFvFWxY',
	acl: 'public-read'
};

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	try {
		if (!locals.user) {
			error(401, 'Authentication required');
		}

		const data = await request.json();
		const { fileName, mimeType } = data;

		if (!fileName || !mimeType) {
			error(400, 'fileName ve mimeType gereklidir');
		}

		const { baseUrl, accessKeyId, secretAccessKey, region, bucket, acl } = aws;

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

		const command = new CreateMultipartUploadCommand({
			Bucket: bucket,
			Key: path,
			// @ts-ignore
			ACL: acl,
			ContentType: mimeType
		});

		const response = await s3Client.send(command);
		console.log(`[Upload Init] UploadId: ${response.UploadId}`);

		return json({ uploadId: response.UploadId });
	} catch (err) {
		console.error('[Upload Init] Error:', err);
		const errorMessage = err instanceof Error ? err.message : 'Upload başlatılamadı';
		error(500, errorMessage);
	}
}

