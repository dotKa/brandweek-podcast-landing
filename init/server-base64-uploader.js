import { Upload } from '@aws-sdk/lib-storage'
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3'

const aws = {
  baseUrl: 's3.gridstudio.ai',
  bucket: 'app-gridstudio',
  region: 'us-east-1',
  accessKeyId: 'app-gridstudio',
  secretAccessKey: 'EB2RVnzzl4exgMnI7Sb4YueO7bFvFWxY',
  acl: 'public-read',
}

/**
 * Server tarafında base64 dosya yüklemesi
 */
export const ServerBase64Uploader = async (slug, packet, mimeType, fileName, isStream = false) => {
  try {
    const { baseUrl, accessKeyId, secretAccessKey, region, bucket, acl } = aws

    const awsOptions = {
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    }

    // Endpoint tanımla
    if (baseUrl) {
      // @ts-ignore
      awsOptions.endpoint = `https://${baseUrl}`
      // @ts-ignore
      awsOptions.forcePathStyle = true
    }

    const s3Client = new S3Client(awsOptions)

    let packetData = packet

    if (!isStream) {
      const regex = new RegExp(`^${mimeType}/\\w+;base64,`)
      packetData = Buffer.from(packet.replace(regex, ''), 'base64')
    }

    // Dosya yolunu oluştur
    const path = `reji-app/${new Date().getFullYear()}/${slug}/${fileName}`

    const params = {
      Bucket: bucket,
      Key: path,
      Body: packetData,
      // @ts-ignore
      ACL: acl,
      ContentEncoding: isStream ? 'utf-8' : 'base64',
      ContentType: mimeType,
    }

    const upload = new Upload({
      client: s3Client,
      params,
      // Multipart upload ayarları - büyük dosyalar için optimize edildi
      partSize: 10 * 1024 * 1024, // 10 MB per part (S3 minimum 5 MB, optimal 10 MB)
      leavePartsOnError: false, // Hata durumunda part'ları temizle
      queueSize: 4, // Paralel upload part sayısı (4 part aynı anda)
    })

    // Upload progress tracking (opsiyonel - log için)
    upload.on('httpUploadProgress', (progress) => {
      if (progress.total && progress.loaded !== undefined) {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(2);
        console.log(`[S3 Upload] Progress: ${percent}% - ${(progress.loaded / 1024 / 1024).toFixed(2)} MB / ${(progress.total / 1024 / 1024).toFixed(2)} MB`);
      }
    });

    const response = await upload.done()
    return response.Location
  } catch (error) {
    console.error('Dosya yükleme hatası:', error)
    throw new Error('S3 sunucusuna dosya yüklenemedi')
  }
};

/**
 * Multipart upload başlatma
 */
// @ts-ignore
export const initMultipartUpload = async (slug, mimeType, fileName) => {
  try {
    const { baseUrl, accessKeyId, secretAccessKey, region, bucket, acl } = aws

    const awsOptions = {
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    }

    if (baseUrl) {
      // @ts-ignore
      awsOptions.endpoint = `https://${baseUrl}`
      // @ts-ignore
      awsOptions.forcePathStyle = true
    }

    const s3Client = new S3Client(awsOptions)
    const path = `reji-app/${new Date().getFullYear()}/${slug}/${fileName}`

    const command = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: path,
      // @ts-ignore
      ACL: acl,
      ContentType: mimeType,
    })

    const response = await s3Client.send(command)
    console.log(`[S3 Multipart] Upload başlatıldı - UploadId: ${response.UploadId}`)
    return response.UploadId
  } catch (error) {
    console.error('Multipart upload başlatma hatası:', error)
    throw new Error('Multipart upload başlatılamadı')
  }
}

/**
 * Chunk yükleme
 */
// @ts-ignore
export const uploadChunk = async (uploadId, partNumber, chunk, slug, fileName) => {
  try {
    const { baseUrl, accessKeyId, secretAccessKey, region, bucket } = aws

    const awsOptions = {
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    }

    if (baseUrl) {
      // @ts-ignore
      awsOptions.endpoint = `https://${baseUrl}`
      // @ts-ignore
      awsOptions.forcePathStyle = true
    }

    const s3Client = new S3Client(awsOptions)
    const path = `reji-app/${new Date().getFullYear()}/${slug}/${fileName}`

    // Chunk'ı Buffer'a çevir
    const chunkBuffer = Buffer.from(await chunk.arrayBuffer())

    const command = new UploadPartCommand({
      Bucket: bucket,
      Key: path,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: chunkBuffer,
    })

    const response = await s3Client.send(command)
    console.log(`[S3 Multipart] Chunk ${partNumber} yüklendi - ETag: ${response.ETag}`)
    return response.ETag
  } catch (error) {
    console.error(`Chunk ${partNumber} yükleme hatası:`, error)
    throw new Error(`Chunk ${partNumber} yüklenemedi`)
  }
}

/**
 * Multipart upload tamamlama
 */
// @ts-ignore
export const completeMultipartUpload = async (uploadId, parts, slug, fileName) => {
  try {
    const { baseUrl, accessKeyId, secretAccessKey, region, bucket } = aws

    const awsOptions = {
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region,
    }

    if (baseUrl) {
      // @ts-ignore
      awsOptions.endpoint = `https://${baseUrl}`
      // @ts-ignore
      awsOptions.forcePathStyle = true
    }

    const s3Client = new S3Client(awsOptions)
    const path = `reji-app/${new Date().getFullYear()}/${slug}/${fileName}`

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: path,
      UploadId: uploadId,
      MultipartUpload: {
        // @ts-ignore
        Parts: parts.map((part) => ({
          ETag: part.etag,
          PartNumber: part.partNumber,
        })),
      },
    })

    const response = await s3Client.send(command)
    console.log(`[S3 Multipart] Upload tamamlandı - Location: ${response.Location}`)
    return response.Location
  } catch (error) {
    console.error('Multipart upload tamamlama hatası:', error)
    throw new Error('Multipart upload tamamlanamadı')
  }
}
