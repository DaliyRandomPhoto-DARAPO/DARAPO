import { MulterModuleOptions } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const multerConfig: MulterModuleOptions = {
  storage: memoryStorage(),
  fileFilter: (req, file, callback) => {
    // image/* 전반 허용 (서버에서 재인코딩/검증 수행)
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      callback(new Error('이미지 파일만 업로드 가능합니다.'), false);
      return;
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};
