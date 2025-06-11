import { prisma } from './prisma';

export interface CreateFlashcardData {
  question: string;
  answer: string;
  pdfId: string;
  userId: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface UpdateFlashcardData {
  question?: string;
  answer?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface ReviewFlashcardData {
  rating: 'EASY' | 'MEDIUM' | 'HARD' | 'AGAIN';
}

// 创建闪卡
export async function createFlashcard(data: CreateFlashcardData) {
  try {
    const flashcard = await prisma.flashcard.create({
      data: {
        question: data.question,
        answer: data.answer,
        difficulty: data.difficulty || 'MEDIUM',
        pdfId: data.pdfId,
        userId: data.userId,
      },
      include: {
        pdf: true,
        user: true,
      },
    });
    
    return flashcard;
  } catch (error) {
    console.error('创建闪卡失败:', error);
    throw new Error('创建闪卡失败');
  }
}

// 获取用户的所有闪卡
export async function getUserFlashcards(userId: string, pdfId?: string) {
  try {
    const where = {
      userId,
      ...(pdfId && { pdfId }),
    };

    const flashcards = await prisma.flashcard.findMany({
      where,
      include: {
        pdf: true,
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return flashcards;
  } catch (error) {
    console.error('获取闪卡失败:', error);
    throw new Error('获取闪卡失败');
  }
}

// 获取单个闪卡
export async function getFlashcard(id: string, userId: string) {
  try {
    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        pdf: true,
        reviews: {
          orderBy: { reviewedAt: 'desc' },
        },
      },
    });

    return flashcard;
  } catch (error) {
    console.error('获取闪卡失败:', error);
    throw new Error('获取闪卡失败');
  }
}

// 更新闪卡
export async function updateFlashcard(id: string, userId: string, data: UpdateFlashcardData) {
  try {
    const flashcard = await prisma.flashcard.update({
      where: {
        id,
        userId,
      },
      data,
      include: {
        pdf: true,
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 1,
        },
      },
    });

    return flashcard;
  } catch (error) {
    console.error('更新闪卡失败:', error);
    throw new Error('更新闪卡失败');
  }
}

// 删除闪卡
export async function deleteFlashcard(id: string, userId: string) {
  try {
    await prisma.flashcard.delete({
      where: {
        id,
        userId,
      },
    });

    return true;
  } catch (error) {
    console.error('删除闪卡失败:', error);
    throw new Error('删除闪卡失败');
  }
}

// 复习闪卡
export async function reviewFlashcard(flashcardId: string, data: ReviewFlashcardData) {
  try {
    // 计算下次复习时间（简单的间隔重复算法）
    const getNextReviewDate = (rating: string) => {
      const now = new Date();
      const intervals = {
        AGAIN: 1,    // 1天
        HARD: 3,     // 3天
        MEDIUM: 7,   // 7天
        EASY: 14,    // 14天
      };
      
      const days = intervals[rating as keyof typeof intervals] || 7;
      return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    };

    const review = await prisma.flashcardReview.create({
      data: {
        rating: data.rating,
        nextReview: getNextReviewDate(data.rating),
        flashcardId,
      },
      include: {
        flashcard: {
          include: {
            pdf: true,
          },
        },
      },
    });

    return review;
  } catch (error) {
    console.error('复习闪卡失败:', error);
    throw new Error('复习闪卡失败');
  }
}

// 获取需要复习的闪卡
export async function getDueFlashcards(userId: string) {
  try {
    const now = new Date();
    
    // 获取所有闪卡及其最新复习记录
    const flashcards = await prisma.flashcard.findMany({
      where: {
        userId,
      },
      include: {
        pdf: true,
        reviews: {
          orderBy: { reviewedAt: 'desc' },
          take: 1,
        },
      },
    });

    // 筛选出需要复习的闪卡
    const dueFlashcards = flashcards.filter(flashcard => {
      if (flashcard.reviews.length === 0) {
        // 新闪卡，需要复习
        return true;
      }
      
      const lastReview = flashcard.reviews[0];
      return lastReview.nextReview <= now;
    });

    return dueFlashcards;
  } catch (error) {
    console.error('获取待复习闪卡失败:', error);
    throw new Error('获取待复习闪卡失败');
  }
}

// 获取闪卡统计信息
export async function getFlashcardStats(userId: string, pdfId?: string) {
  try {
    const where = {
      userId,
      ...(pdfId && { pdfId }),
    };

    const total = await prisma.flashcard.count({ where });
    
    const reviewed = await prisma.flashcard.count({
      where: {
        ...where,
        reviews: {
          some: {},
        },
      },
    });

    const due = await getDueFlashcards(userId);
    const dueCount = pdfId 
      ? due.filter(f => f.pdfId === pdfId).length 
      : due.length;

    return {
      total,
      reviewed,
      due: dueCount,
      new: total - reviewed,
    };
  } catch (error) {
    console.error('获取闪卡统计失败:', error);
    throw new Error('获取闪卡统计失败');
  }
}