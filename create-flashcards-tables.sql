-- 创建闪卡相关表
-- 1. 闪卡表
CREATE TABLE IF NOT EXISTS flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_id TEXT NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    page_number INTEGER,
    difficulty INTEGER DEFAULT 0, -- 0: 新卡片, 1: 容易, 2: 中等, 3: 困难
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 学习会话表
CREATE TABLE IF NOT EXISTS flashcard_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pdf_id TEXT NOT NULL REFERENCES pdfs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    cards_studied INTEGER DEFAULT 0,
    cards_easy INTEGER DEFAULT 0,
    cards_medium INTEGER DEFAULT 0,
    cards_hard INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 闪卡复习记录表
CREATE TABLE IF NOT EXISTS flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
    session_id UUID REFERENCES flashcard_sessions(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    difficulty_rating INTEGER NOT NULL, -- 1: 容易, 2: 中等, 3: 困难
    response_time INTEGER, -- 响应时间（秒）
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_flashcards_pdf_user ON flashcards(pdf_id, user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_difficulty ON flashcards(difficulty);
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON flashcards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_flashcard_sessions_pdf_user ON flashcard_sessions(pdf_id, user_id);
CREATE INDEX IF NOT EXISTS idx_flashcard_reviews_flashcard ON flashcard_reviews(flashcard_id);

-- 启用RLS
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_reviews ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- flashcards表策略
CREATE POLICY "Users can view their own flashcards" ON flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own flashcards" ON flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flashcards" ON flashcards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flashcards" ON flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- flashcard_sessions表策略
CREATE POLICY "Users can view their own sessions" ON flashcard_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON flashcard_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON flashcard_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- flashcard_reviews表策略
CREATE POLICY "Users can view their own reviews" ON flashcard_reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reviews" ON flashcard_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);