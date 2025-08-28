import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
  resize?: boolean;
}

export const DEFAULT_IMAGE_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  format: SaveFormat.JPEG,
  resize: true,
};

/**
 * 이미지 최적화 함수
 * - 크기 조정
 * - 품질 압축
 * - 포맷 변환
 */
export const optimizeImage = async (
  uri: string,
  options: Partial<ImageOptimizationOptions> = {}
): Promise<string> => {
  const config = { ...DEFAULT_IMAGE_OPTIONS, ...options };

  const actions = [];

  // 크기 조정
  if (config.resize && (config.maxWidth || config.maxHeight)) {
    actions.push({
      resize: {
        width: config.maxWidth,
        height: config.maxHeight,
      },
    });
  }

  // 품질 압축
  if (config.quality !== undefined && config.quality < 1) {
    // manipulateAsync에서 quality는 별도 처리
  }

  if (actions.length === 0) {
    return uri; // 최적화가 필요 없음
  }

  try {
    const result = await manipulateAsync(
      uri,
      actions,
      {
        compress: config.quality || 0.8,
        format: config.format || SaveFormat.JPEG,
        base64: false,
      }
    );

    return result.uri;
  } catch (error) {
    console.warn('Image optimization failed:', error);
    return uri; // 실패 시 원본 반환
  }
};

/**
 * 썸네일용 이미지 최적화
 */
export const optimizeThumbnail = async (uri: string): Promise<string> => {
  return optimizeImage(uri, {
    maxWidth: 300,
    maxHeight: 300,
    quality: 0.7,
    format: SaveFormat.JPEG,
    resize: true,
  });
};

/**
 * 프로필 이미지용 최적화
 */
export const optimizeProfileImage = async (uri: string): Promise<string> => {
  return optimizeImage(uri, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    format: SaveFormat.JPEG,
    resize: true,
  });
};

/**
 * 피드 이미지용 최적화
 */
export const optimizeFeedImage = async (uri: string): Promise<string> => {
  return optimizeImage(uri, {
    maxWidth: 1080,
    maxHeight: 1080,
    quality: 0.8,
    format: SaveFormat.JPEG,
    resize: true,
  });
};

/**
 * 이미지 크기 정보 가져오기
 */
export const getImageInfo = async (uri: string) => {
  try {
    const result = await manipulateAsync(
      uri,
      [],
      {
        base64: false,
      }
    );

    return {
      width: result.width,
      height: result.height,
      uri: result.uri,
    };
  } catch (error) {
    console.warn('Failed to get image info:', error);
    return null;
  }
};
