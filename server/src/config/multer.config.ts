import { MulterModuleOptions } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const multerConfig: MulterModuleOptions = {
  storage: memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
      callback(new Error('이미지 파일만 업로드 가능합니다.'), false);
    } else {
      callback(null, true);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};