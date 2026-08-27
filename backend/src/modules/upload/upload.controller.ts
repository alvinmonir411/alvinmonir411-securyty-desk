import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query,
  Body,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { StorageService, UploadResult } from '../../integrations/storage/storage.service';
import { Public } from '../../common/decorators';

@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post('image')
  @Public()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
          return callback(
            new BadRequestException('Only image files (JPG, PNG, WebP, GIF, SVG) are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload an image file directly to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'avatars' },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folderQuery?: string,
    @Body('folder') folderBody?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No image file provided for upload');
    }

    const folder = folderQuery || folderBody || 'images';
    return this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );
  }

  @Post('document')
  @Public()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
      },
      fileFilter: (req, file, callback) => {
        if (
          !file.mimetype.match(
            /\/(pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet|plain|jpg|jpeg|png|webp)$/,
          )
        ) {
          return callback(
            new BadRequestException(
              'Only PDF, DOCX, XLSX, TXT, and image documents are allowed!',
            ),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload a document / certificate to Cloudinary' })
  @ApiConsumes('multipart/form-data')
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folderQuery?: string,
    @Body('folder') folderBody?: string,
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('No document file provided for upload');
    }

    const folder = folderQuery || folderBody || 'documents';
    return this.storageService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      folder,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an uploaded asset from Cloudinary' })
  async deleteAsset(@Body('publicId') publicId: string) {
    if (!publicId) {
      throw new BadRequestException('publicId is required to delete asset');
    }
    const success = await this.storageService.deleteFile(publicId);
    return { success, message: success ? 'Asset deleted successfully' : 'Asset not found or failed to delete' };
  }
}
