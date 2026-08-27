import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

export interface UploadResult {
  url: string;
  key: string;
  publicId?: string;
  size: number;
  mimeType: string;
  format?: string;
  width?: number;
  height?: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private isCloudinaryConfigured = false;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('app.cloudinary.cloudName') || process.env.CLOUDINARY_CLOUD_NAME || 'dgaiqqh7k';
    const apiKey = this.config.get<string>('app.cloudinary.apiKey') || process.env.CLOUDINARY_API_KEY || '415555729322332';
    const apiSecret = this.config.get<string>('app.cloudinary.apiSecret') || process.env.CLOUDINARY_API_SECRET || 'Cqkj0E-JfT1Gb0s_ab3Gwxy1nZE';

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.isCloudinaryConfigured = true;
      this.logger.log(`Cloudinary storage initialized for cloud: ${cloudName}`);
    } else {
      this.logger.warn('Cloudinary credentials missing in configuration');
    }
  }

  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'general',
  ): Promise<UploadResult> {
    if (!this.isCloudinaryConfigured) {
      throw new Error('Cloudinary is not configured on the server');
    }

    const isImage = mimeType?.startsWith('image/');
    const resourceType: 'image' | 'raw' | 'auto' = isImage ? 'image' : 'auto';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `school-management/${folder}`,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            this.logger.error(`Cloudinary upload failed: ${error?.message || 'Unknown error'}`);
            return reject(error || new Error('Cloudinary upload returned empty response'));
          }

          this.logger.log(`Cloudinary asset uploaded: ${result.secure_url} (${result.public_id})`);

          resolve({
            url: result.secure_url,
            key: result.public_id,
            publicId: result.public_id,
            size: result.bytes,
            mimeType: mimeType || result.format,
            format: result.format,
            width: result.width,
            height: result.height,
          });
        },
      );

      // Pipe buffer into Cloudinary upload stream using Node native stream
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  async deleteFile(publicId: string): Promise<boolean> {
    try {
      if (!this.isCloudinaryConfigured) return false;
      const res = await cloudinary.uploader.destroy(publicId);
      return res.result === 'ok';
    } catch (err: any) {
      this.logger.error(`Error deleting Cloudinary asset ${publicId}: ${err.message}`);
      return false;
    }
  }
}
