import { MulterModuleOptions } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const multerConfig: MulterModuleOptions = {
  storage: memoryStorage(),
  fileFilter: (req, file, callback) => {
    // image/* 전반 허용 (서버에서 재인코딩/검증 수행)
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      // 콜백으로 false만 전달하여 컨트롤러에서 400 처리하도록 위임
      req._fileFilterReason = 'invalid-mime';
      callback(null, false);
      return;
    }
    callback(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
};
