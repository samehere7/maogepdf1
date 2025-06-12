// 实现SuperMemo SM-2间隔重复算法
// 参考: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

interface ReviewGrade {
  quality: number;  // 0-5的评分
  interval: number; // 间隔天数
  repetitions: number; // 重复次数
  easeFactor: number; // 难度因子
}

// 默认参数
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const FIRST_INTERVAL = 1;
const SECOND_INTERVAL = 6;

export function calculateNextReview(
  quality: number,
  previousInterval: number = 0,
  previousRepetitions: number = 0,
  previousEaseFactor: number = DEFAULT_EASE_FACTOR
): ReviewGrade {
  // 确保quality在0-5之间
  quality = Math.min(5, Math.max(0, quality));

  let interval: number;
  let repetitions: number = previousRepetitions;
  let easeFactor: number = previousEaseFactor;

  // 如果回答质量小于3，重置学习进度
  if (quality < 3) {
    repetitions = 0;
    interval = FIRST_INTERVAL;
  } else {
    repetitions += 1;

    // 根据重复次数计算间隔
    if (repetitions === 1) {
      interval = FIRST_INTERVAL;
    } else if (repetitions === 2) {
      interval = SECOND_INTERVAL;
    } else {
      interval = Math.round(previousInterval * easeFactor);
    }

    // 更新难度因子
    easeFactor = Math.max(
      MIN_EASE_FACTOR,
      easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );
  }

  return {
    quality,
    interval,
    repetitions,
    easeFactor
  };
}

// 将评分转换为quality值
export function ratingToQuality(rating: 'AGAIN' | 'HARD' | 'MEDIUM' | 'EASY'): number {
  const ratingMap = {
    'AGAIN': 0,  // 完全不会
    'HARD': 2,   // 记得很困难
    'MEDIUM': 3, // 记得有点困难
    'EASY': 5    // 完全记住了
  };
  return ratingMap[rating];
}

// 计算下次复习时间
export function getNextReviewDate(
  rating: 'AGAIN' | 'HARD' | 'MEDIUM' | 'EASY',
  previousInterval: number = 0,
  previousRepetitions: number = 0,
  previousEaseFactor: number = DEFAULT_EASE_FACTOR
): Date {
  const quality = ratingToQuality(rating);
  const { interval } = calculateNextReview(
    quality,
    previousInterval,
    previousRepetitions,
    previousEaseFactor
  );

  const now = new Date();
  return new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);
} 