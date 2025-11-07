import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';

const aws = {
	baseUrl: 's3.gridstudio.ai',
	bucket: 'app-gridstudio',
	region: 'us-east-1',
	accessKeyId: 'app-gridstudio',
	secretAccessKey: 'EB2RVnzzl4exgMnI7Sb4YueO7bFvFWxY',
	acl: 'public-read'
};

/**
 * Server tarafında base64 dosya yüklemesi
 * @param {string} base64Data - Base64 encoded data (with or without data URI prefix)
 * @param {string} mimeType - MIME type of the file
 * @param {string} fileName - Name of the file
 */
export async function uploadBase64File(base64Data, mimeType, fileName) {
	try {
		const { baseUrl, accessKeyId, secretAccessKey, region, bucket, acl } = aws;

		const awsOptions = {
			credentials: {
				accessKeyId,
				secretAccessKey
			},
			region
		};

		// Endpoint tanımla
		if (baseUrl) {
			// @ts-ignore - Custom endpoint için
			awsOptions.endpoint = `https://${baseUrl}`;
			// @ts-ignore - Path style için
			awsOptions.forcePathStyle = true;
		}

		const s3Client = new S3Client(awsOptions);

		// Base64'ten Buffer'a çevir
		// Base64 data formatı: "data:mimeType;base64,actualBase64Data"
		let actualBase64 = base64Data;
		if (base64Data.includes(',')) {
			// Data URI formatından sadece base64 kısmını al
			actualBase64 = base64Data.split(',')[1];
		} else if (base64Data.startsWith('data:')) {
			// Eğer data: prefix'i varsa ama virgül yoksa (olması gerekmez ama yine de kontrol edelim)
			const regex = /^data:[\w\/]+;base64,/;
			actualBase64 = base64Data.replace(regex, '');
		}
		
		console.log('[Uploader] Base64 data length:', actualBase64.length);
		const packetData = Buffer.from(actualBase64, 'base64');
		console.log('[Uploader] Buffer size:', packetData.length, 'bytes');

		// Dosya yolunu oluştur - bw-landing klasörü altına
		const path = `bw-landing/${new Date().getFullYear()}/${fileName}`;

		const params = {
			Bucket: bucket,
			Key: path,
			Body: packetData,
			// @ts-ignore - ACL type issue
			ACL: acl,
			ContentType: mimeType
		};

		const upload = new Upload({
			client: s3Client,
			params,
			partSize: 10 * 1024 * 1024, // 10 MB per part
			leavePartsOnError: false,
			queueSize: 4
		});

		// Upload progress tracking
		upload.on('httpUploadProgress', (progress) => {
			if (progress.total && progress.loaded !== undefined) {
				const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
				console.log(
					`[S3 Upload] Progress: ${percent}% - ${(progress.loaded / 1024 / 1024).toFixed(2)} MB / ${(progress.total / 1024 / 1024).toFixed(2)} MB`
				);
			}
		});

		const response = await upload.done();
		console.log('[Uploader] Upload completed, Location:', response.Location);
		return response.Location;
	} catch (error) {
		console.error('[Uploader] Dosya yükleme hatası:', error);
		const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
		throw new Error(`S3 sunucusuna dosya yüklenemedi: ${errorMessage}`);
	}
}

