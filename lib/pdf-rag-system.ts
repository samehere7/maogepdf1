// 导入已有的PDF文本提取功能
import { extractTextFromPDF } from './pdf-text-extractor';

// PDF段落内容接口
interface PDFChunk {
  id: string;
  pageNumber: number;
  text: string;
  embedding?: number[]; // 向量嵌入
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata: {
    fontSize: number;
    fontName: string;
    isTitle: boolean;
    confidence: number;
  };
}

// 搜索结果接口
interface SearchResult {
  chunk: PDFChunk;
  similarity: number;
  relevance: string;
}

// 对话上下文接口
interface ConversationContext {
  query: string;
  relevantChunks: SearchResult[];
  conversationHistory: Array<{role: string, content: string}>;
  pdfMetadata: {
    title: string;
    totalPages: number;
    language: 'zh' | 'en' | 'mixed';
  };
}

// 语言指令映射 - 增强版本
function getLanguageInstruction(locale: string): string {
  const instructions = {
    'zh': '【重要】必须用中文回答！不要使用英文。请用中文回答，保持简洁实用。',
    'en': '【IMPORTANT】You must respond in English! Please respond in English, keep it concise and practical.',
    'ko': '【중요】반드시 한국어로 답변하세요! 영어를 사용하지 마세요. 한국어로 답변해 주세요. 간결하고 실용적으로 유지하세요.',
    'ja': '【重要】必ず日本語で回答してください！英語を使わないでください。日本語で回答してください。簡潔で実用的に保ってください。',
    'es': '【IMPORTANTE】¡Debes responder en español! No uses inglés. Por favor responde en español, manteniéndolo conciso y práctico.',
    'fr': '【IMPORTANT】Vous devez répondre en français ! N\'utilisez pas l\'anglais. Veuillez répondre en français, en restant concis et pratique.',
    'de': '【WICHTIG】Sie müssen auf Deutsch antworten! Verwenden Sie kein Englisch. Bitte antworten Sie auf Deutsch, prägnant und praktisch.',
    'it': '【IMPORTANTE】Devi rispondere in italiano! Non usare l\'inglese. Si prega di rispondere in italiano, mantenendolo conciso e pratico.',
    'pt-BR': '【IMPORTANTE】Você deve responder em português! Não use inglês. Por favor, responda em português, mantendo-o conciso e prático.',
    'ru': '【ВАЖНО】Вы должны отвечать на русском языке! Не используйте английский. Пожалуйста, отвечайте на русском языке, оставайтесь краткими и практичными.',
    'hi': '【महत्वपूर्ण】आपको हिंदी में उत्तर देना चाहिए! अंग्रेजी का उपयोग न करें। कृपया हिंदी में उत्तर दें, इसे संक्षिप्त और व्यावहारिक रखें।',
    'th': '【สำคัญ】คุณต้องตอบเป็นภาษาไทย! อย่าใช้ภาษาอังกฤษ กรุณาตอบเป็นภาษาไทย ให้กระชับและใช้งานได้จริง',
    'vi': '【QUAN TRỌNG】Bạn phải trả lời bằng tiếng Việt! Đừng sử dụng tiếng Anh. Vui lòng trả lời bằng tiếng Việt, giữ cho ngắn gọn và thực tế.',
    'tr': '【ÖNEMLİ】Türkçe yanıtlamalısınız! İngilizce kullanmayın. Lütfen Türkçe yanıtlayın, kısa ve pratik tutun.',
    'ar': '【مهم】يجب أن تجيب باللغة العربية! لا تستخدم الإنجليزية. يرجى الإجابة باللغة العربية، واجعلها موجزة وعملية.',
    'bn': '【গুরুত্বপূর্ণ】আপনাকে অবশ্যই বাংলায় উত্তর দিতে হবে! ইংরেজি ব্যবহার করবেন না। অনুগ্রহ করে বাংলায় উত্তর দিন, সংক্ষিপ্ত এবং ব্যবহারিক রাখুন।',
    'da': '【VIGTIGT】Du skal svare på dansk! Brug ikke engelsk. Svar venligst på dansk, hold det kortfattet og praktisk.',
    'fi': '【TÄRKEÄÄ】Sinun täytyy vastata suomeksi! Älä käytä englantia. Vastaa suomeksi, pidä se ytimekkäänä ja käytännöllisenä.',
    'id': '【PENTING】Anda harus menjawab dalam bahasa Indonesia! Jangan gunakan bahasa Inggris. Harap jawab dalam bahasa Indonesia, jaga agar ringkas dan praktis.',
    'kn': '【ಮುಖ್ಯ】ನೀವು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಬೇಕು! ಇಂಗ್ಲಿಷ್ ಬಳಸಬೇಡಿ। ದಯವಿಟ್ಟು ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರಿಸಿ, ಸಂಕ್ಷಿಪ್ತ ಮತ್ತು ಪ್ರಾಯೋಗಿಕವಾಗಿ ಇರಿಸಿ।',
    'ms': '【PENTING】Anda mesti menjawab dalam bahasa Melayu! Jangan guna bahasa Inggeris. Sila jawab dalam bahasa Melayu, pastikan ringkas dan praktikal.',
    'nl': '【BELANGRIJK】Je moet in het Nederlands antwoorden! Gebruik geen Engels. Antwoord alstublieft in het Nederlands, houd het beknopt en praktisch.',
    'no': '【VIKTIG】Du må svare på norsk! Ikke bruk engelsk. Vennligst svar på norsk, hold det konsist og praktisk.',
    'pa': '【ਮਹੱਤਵਪੂਰਨ】ਤੁਹਾਨੂੰ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦੇਣਾ ਚਾਹੀਦਾ ਹੈ! ਅੰਗਰੇਜ਼ੀ ਦੀ ਵਰਤੋਂ ਨਾ ਕਰੋ। ਕਿਰਪਾ ਕਰਕੇ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ, ਇਸਨੂੰ ਸੰਖੇਪ ਅਤੇ ਵਿਹਾਰਕ ਰੱਖੋ।',
    'pl': '【WAŻNE】Musisz odpowiadać po polsku! Nie używaj angielskiego. Proszę odpowiedzieć po polsku, zachowując zwięzłość i praktyczność.',
    'sv': '【VIKTIGT】Du måste svara på svenska! Använd inte engelska. Vänligen svara på svenska, håll det kortfattat och praktiskt.'
  };
  
  return instructions[locale as keyof typeof instructions] || instructions['en'];
}

/**
 * PDF RAG 系统核心类
 * 实现文档分段、向量检索、智能对话功能
 */
export class PDFRAGSystem {
  private chunks: PDFChunk[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private conversationHistory: Array<{role: string, content: string}> = [];
  private searchCache: Map<string, SearchResult[]> = new Map();
  private lastProcessedPdfUrl: string = '';
  private cacheMaxSize: number = 50; // 最多缓存50个搜索结果
  
  // 添加PDF识别信息
  private currentPdfId: string = '';
  private pdfContentMap: Map<string, PDFChunk[]> = new Map(); // 存储每个PDF的内容
  
  /**
   * 从PDF URL提取并分段文本
   */
  async extractAndChunkPDF(pdfUrl: string, pdfId?: string): Promise<PDFChunk[]> {
    try {
      console.log('[RAG] 开始提取PDF并分段:', pdfUrl);
      
      // 设置当前处理的PDF ID
      if (pdfId) {
        this.currentPdfId = pdfId;
      }
      
      // 检查是否已经处理过这个PDF
      if (pdfId && this.pdfContentMap.has(pdfId)) {
        console.log('[RAG] 使用已缓存的PDF内容:', pdfId);
        this.chunks = this.pdfContentMap.get(pdfId)!;
        return this.chunks;
      }
      
      // 使用已有的PDF文本提取功能
      const fullText = await extractTextFromPDF(pdfUrl);
      console.log(`[RAG] PDF文本提取成功，长度: ${fullText.length}`);
      
      // 按页面分割文本
      const pagesWithNumbers = this.splitTextByPages(fullText);
      const chunks: PDFChunk[] = [];
      
      // 处理每页文本
      pagesWithNumbers.forEach((pageData) => {
        const pageNum = pageData.pageNumber;
        const pageText = pageData.content;
        
        // 按段落分割页面文本
        const paragraphs = this.splitPageIntoParagraphs(pageText, pageNum);
        
        // 将段落转换为chunks
        paragraphs.forEach((paragraph, index) => {
          if (paragraph.text.trim().length > 20) { // 过滤太短的文本
            chunks.push({
              id: `${pdfId || 'default'}-page-${pageNum}-chunk-${index}`,
              pageNumber: pageNum,
              text: paragraph.text.trim(),
              position: paragraph.position,
              metadata: {
                fontSize: paragraph.fontSize,
                fontName: paragraph.fontName,
                isTitle: this.isLikelyTitle(paragraph.text, paragraph.fontSize),
                confidence: this.calculateTextConfidence(paragraph.text)
              }
            });
          }
        });
      });
      
      // 缓存PDF内容
      if (pdfId) {
        this.pdfContentMap.set(pdfId, chunks);
      }
      
      this.chunks = chunks;
      console.log(`[RAG] 成功提取${chunks.length}个文本块，覆盖${pagesWithNumbers.length}页`);
      
      // 为每个chunk生成简单的TF-IDF向量（简化版嵌入）
      await this.generateSimpleEmbeddings();
      
      return chunks;
    } catch (error) {
      console.error('[RAG] PDF提取失败:', error);
      throw new Error('PDF文档处理失败');
    }
  }
  
  /**
   * 按页面分割文本，确保页码与内容准确对应
   */
  private splitTextByPages(fullText: string): Array<{pageNumber: number, content: string}> {
    // 使用更精确的正则表达式分割页面，确保页码对应正确
    const pageMatches = [...fullText.matchAll(/=== 第(\d+)页 ===\n([\s\S]*?)(?=\n=== 第\d+页 ===|$)/g)];
    
    if (pageMatches.length === 0) {
      // 如果没有找到页码标记，尝试其他分割方式
      const pages = fullText.split(/=== 第\d+页 ===/);
      if (pages.length > 1) {
        // 过滤掉空页面，假设按顺序排列
        return pages.slice(1)
          .map((page, index) => ({
            pageNumber: index + 1,
            content: page.trim()
          }))
          .filter(page => page.content.length > 0);
      }
      // 如果仍然无法分割，返回完整文本作为第1页
      return [{pageNumber: 1, content: fullText.trim()}];
    }
    
    // 创建页面内容数组，确保页码和内容正确对应
    const pagesWithNumbers: Array<{pageNumber: number, content: string}> = [];
    
    pageMatches.forEach(match => {
      const pageNumber = parseInt(match[1]);
      const content = match[2].trim();
      if (content.length > 0) {
        pagesWithNumbers.push({ pageNumber, content });
      }
    });
    
    // 按页码排序确保顺序正确
    pagesWithNumbers.sort((a, b) => a.pageNumber - b.pageNumber);
    
    return pagesWithNumbers;
  }
  
  /**
   * 将页面文本分割为段落
   */
  private splitPageIntoParagraphs(pageText: string, pageNum: number): Array<{
    text: string;
    position: { x: number; y: number; width: number; height: number };
    fontSize: number;
    fontName: string;
  }> {
    const paragraphs = [];
    
    // 按空行分割段落
    const segments = pageText.split(/\n\s*\n/).filter(seg => seg.trim().length > 0);
    
    segments.forEach((segment, index) => {
      const text = segment.trim();
      if (text.length > 10) { // 过滤太短的段落
        paragraphs.push({
          text: text,
          position: {
            x: 0,
            y: index * 50, // 模拟位置
            width: text.length * 8, // 模拟宽度
            height: 20 // 模拟高度
          },
          fontSize: this.estimateFontSize(text),
          fontName: 'default'
        });
      }
    });
    
    return paragraphs;
  }
  
  /**
   * 估算字体大小（用于判断是否为标题）
   */
  private estimateFontSize(text: string): number {
    // 简单的启发式规则
    if (text.length < 30 && (
      text.includes('：') || 
      text.match(/^[A-Z][a-z\s]+$/) || 
      text.match(/^第?\d+[章节课]/) ||
      text.match(/^[一二三四五六七八九十]+[、.]/)
    )) {
      return 16; // 可能是标题
    }
    return 12; // 普通文本
  }

  /**
   * 将文本项按段落分组（原方法保留但不使用）
   */
  private groupTextItemsIntoParagraphs(textItems: any[], viewport: any) {
    const items = textItems.map(item => ({
      text: item.str,
      x: item.transform[4],
      y: viewport.height - item.transform[5], // 转换坐标系
      width: item.width,
      height: item.height,
      fontSize: Math.abs(item.transform[3]),
      fontName: item.fontName || 'default'
    }));
    
    // 按Y坐标分组为行
    const lines: Array<typeof items> = [];
    let currentLine: typeof items = [];
    let lastY = -1;
    
    items.sort((a, b) => b.y - a.y || a.x - b.x); // 从上到下，从左到右
    
    for (const item of items) {
      if (lastY === -1 || Math.abs(item.y - lastY) < 5) {
        currentLine.push(item);
      } else {
        if (currentLine.length > 0) {
          lines.push([...currentLine]);
        }
        currentLine = [item];
      }
      lastY = item.y;
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    
    // 将相邻的行合并为段落
    const paragraphs = [];
    let currentParagraph = '';
    let paragraphBounds = { x: 0, y: 0, width: 0, height: 0 };
    let paragraphFontSize = 0;
    let paragraphFontName = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineText = line.map(item => item.text).join('');
      
      if (lineText.trim()) {
        // 检查是否应该开始新段落
        const shouldStartNewParagraph = this.shouldStartNewParagraph(
          currentParagraph, 
          lineText, 
          i > 0 ? lines[i-1] : null,
          line
        );
        
        if (shouldStartNewParagraph && currentParagraph.trim()) {
          paragraphs.push({
            text: currentParagraph.trim(),
            position: paragraphBounds,
            fontSize: paragraphFontSize,
            fontName: paragraphFontName
          });
          currentParagraph = '';
        }
        
        if (!currentParagraph) {
          // 新段落的边界和字体信息
          paragraphBounds = {
            x: Math.min(...line.map(item => item.x)),
            y: Math.min(...line.map(item => item.y)),
            width: Math.max(...line.map(item => item.x + item.width)) - Math.min(...line.map(item => item.x)),
            height: Math.max(...line.map(item => item.height))
          };
          paragraphFontSize = line[0]?.fontSize || 12;
          paragraphFontName = line[0]?.fontName || 'default';
        }
        
        currentParagraph += (currentParagraph ? ' ' : '') + lineText;
      }
    }
    
    // 添加最后一个段落
    if (currentParagraph.trim()) {
      paragraphs.push({
        text: currentParagraph.trim(),
        position: paragraphBounds,
        fontSize: paragraphFontSize,
        fontName: paragraphFontName
      });
    }
    
    return paragraphs;
  }
  
  /**
   * 判断是否应该开始新段落
   */
  private shouldStartNewParagraph(currentParagraph: string, newLine: string, prevLine: any[] | null, currentLine: any[]): boolean {
    // 空段落总是开始新段落
    if (!currentParagraph.trim()) return true;
    
    // 检查字体大小变化（可能是标题）
    if (prevLine && currentLine.length > 0 && prevLine.length > 0) {
      const prevFontSize = prevLine[0]?.fontSize || 12;
      const currentFontSize = currentLine[0]?.fontSize || 12;
      if (Math.abs(currentFontSize - prevFontSize) > 2) {
        return true;
      }
    }
    
    // 检查行间距（段落间通常有更大间距）
    if (prevLine && currentLine.length > 0 && prevLine.length > 0) {
      const prevY = prevLine[0]?.y || 0;
      const currentY = currentLine[0]?.y || 0;
      const lineHeight = currentLine[0]?.fontSize || 12;
      if (Math.abs(prevY - currentY) > lineHeight * 1.5) {
        return true;
      }
    }
    
    // 检查是否像标题
    if (this.isLikelyTitle(newLine, currentLine[0]?.fontSize || 12)) {
      return true;
    }
    
    // 检查段落长度（避免段落过长）
    if (currentParagraph.length > 800) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 判断是否是标题
   */
  private isLikelyTitle(text: string, fontSize: number): boolean {
    const cleanText = text.trim();
    
    // 长度检查
    if (cleanText.length > 100 || cleanText.length < 3) return false;
    
    // 字体大小检查
    if (fontSize > 14) return true;
    
    // 内容模式检查
    const titlePatterns = [
      /^第?\d+[章节课]\s/,
      /^[一二三四五六七八九十]+[、.\s]/,
      /^[A-Z][A-Z\s]+$/,
      /^[\d]+\.[\d]*\s/,
      /为什么|如何|什么是|概述|总结|结论/
    ];
    
    return titlePatterns.some(pattern => pattern.test(cleanText));
  }
  
  /**
   * 计算文本质量置信度
   */
  private calculateTextConfidence(text: string): number {
    let confidence = 1.0;
    
    // 长度惩罚
    if (text.length < 10) confidence *= 0.5;
    if (text.length < 5) confidence *= 0.3;
    
    // 特殊字符过多
    const specialCharRatio = (text.match(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) confidence *= 0.7;
    
    // 重复字符
    if (/(.)\1{3,}/.test(text)) confidence *= 0.5;
    
    return Math.max(0.1, confidence);
  }
  
  /**
   * 生成简化版向量嵌入（TF-IDF）
   */
  private async generateSimpleEmbeddings(): Promise<void> {
    console.log('[RAG] 开始生成文本向量...');
    
    // 提取所有唯一词汇
    const vocabulary = new Set<string>();
    const documents = this.chunks.map(chunk => this.tokenize(chunk.text));
    
    documents.forEach(doc => {
      doc.forEach(term => vocabulary.add(term));
    });
    
    const vocabArray = Array.from(vocabulary);
    console.log(`[RAG] 词汇表大小: ${vocabArray.length}`);
    
    // 计算IDF
    const idf = new Map<string, number>();
    for (const term of vocabArray) {
      const docCount = documents.filter(doc => doc.includes(term)).length;
      idf.set(term, Math.log(documents.length / docCount));
    }
    
    // 为每个chunk生成TF-IDF向量
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const terms = documents[i];
      const termCounts = new Map<string, number>();
      
      // 计算词频
      terms.forEach(term => {
        termCounts.set(term, (termCounts.get(term) || 0) + 1);
      });
      
      // 生成TF-IDF向量
      const vector: number[] = [];
      for (const term of vocabArray) {
        const tf = (termCounts.get(term) || 0) / terms.length;
        const termIdf = idf.get(term) || 0;
        vector.push(tf * termIdf);
      }
      
      // 归一化向量
      const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
      if (magnitude > 0) {
        for (let j = 0; j < vector.length; j++) {
          vector[j] /= magnitude;
        }
      }
      
      this.embeddings.set(chunk.id, vector);
    }
    
    console.log(`[RAG] 成功生成${this.chunks.length}个向量`);
  }
  
  /**
   * 文本分词（简化版）
   */
  private tokenize(text: string): string[] {
    // 中文分词 + 英文分词
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishWords = text.toLowerCase().match(/[a-z]+/g) || [];
    const numbers = text.match(/\d+/g) || [];
    
    return [...chineseChars, ...englishWords, ...numbers]
      .filter(token => token.length > 0);
  }
  
  /**
   * 切换到特定PDF的内容
   */
  switchToPDF(pdfId: string): boolean {
    if (this.pdfContentMap.has(pdfId)) {
      this.currentPdfId = pdfId;
      this.chunks = this.pdfContentMap.get(pdfId)!;
      console.log(`[RAG] 已切换到PDF: ${pdfId}, 包含${this.chunks.length}个文档块`);
      return true;
    }
    console.warn(`[RAG] 未找到PDF内容: ${pdfId}`);
    return false;
  }
  
  /**
   * 基于查询检索相关文档块
   */
  async searchRelevantChunks(query: string, topK: number = 5): Promise<SearchResult[]> {
    console.log(`[RAG] 搜索相关内容: "${query}"`);
    
    if (this.chunks.length === 0) {
      console.warn('[RAG] 没有可搜索的文档块');
      return [];
    }
    
    // 检查缓存
    const cacheKey = `${query.toLowerCase().trim()}_${topK}`;
    if (this.searchCache.has(cacheKey)) {
      console.log('[RAG] 使用缓存结果');
      return this.searchCache.get(cacheKey)!;
    }
    
    // 为查询生成向量
    const queryTerms = this.tokenize(query);
    const queryVector = await this.generateQueryVector(queryTerms);
    
    // 计算相似度
    const similarities: Array<{chunk: PDFChunk, similarity: number}> = [];
    
    for (const chunk of this.chunks) {
      const chunkVector = this.embeddings.get(chunk.id);
      if (chunkVector && queryVector.length === chunkVector.length) {
        const similarity = this.cosineSimilarity(queryVector, chunkVector);
        
        // 额外的关键词匹配加分
        const keywordBonus = this.calculateKeywordMatch(query, chunk.text);
        const finalScore = similarity + keywordBonus;
        
        similarities.push({ 
          chunk, 
          similarity: finalScore 
        });
      }
    }
    
    // 排序并返回top-k结果
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(result => ({
        chunk: result.chunk,
        similarity: result.similarity,
        relevance: this.getRelevanceDescription(result.similarity)
      }));
    
    console.log(`[RAG] 找到${topResults.length}个相关文档块`);
    topResults.forEach((result, index) => {
      console.log(`[RAG] 结果${index + 1}: 相似度${result.similarity.toFixed(3)}, 页面${result.chunk.pageNumber}`);
    });
    
    // 缓存结果（限制缓存大小）
    if (this.searchCache.size >= this.cacheMaxSize) {
      // 删除最旧的缓存项
      const firstKey = this.searchCache.keys().next().value;
      this.searchCache.delete(firstKey);
    }
    this.searchCache.set(cacheKey, topResults);
    
    return topResults;
  }
  
  /**
   * 为查询生成向量
   */
  private async generateQueryVector(queryTerms: string[]): Promise<number[]> {
    // 获取词汇表
    const vocabulary = new Set<string>();
    this.chunks.forEach(chunk => {
      this.tokenize(chunk.text).forEach(term => vocabulary.add(term));
    });
    
    const vocabArray = Array.from(vocabulary);
    const vector = new Array(vocabArray.length).fill(0);
    
    // 简单的词频向量
    const termCounts = new Map<string, number>();
    queryTerms.forEach(term => {
      termCounts.set(term, (termCounts.get(term) || 0) + 1);
    });
    
    for (let i = 0; i < vocabArray.length; i++) {
      const term = vocabArray[i];
      vector[i] = termCounts.get(term) || 0;
    }
    
    // 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }
    
    return vector;
  }
  
  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * 关键词匹配加分
   */
  private calculateKeywordMatch(query: string, text: string): number {
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    let bonus = 0;
    
    // 提取查询中的关键词（去除位置相关词汇，保留内容相关词汇）
    const cleanedQuery = queryLower
      .replace(/在第?几页|第?.*页|页码|在哪页|位于第?几页/g, '')
      .trim();
    
    // 完全匹配清理后的查询
    if (cleanedQuery && textLower.includes(cleanedQuery)) {
      bonus += 0.5; // 提高完全匹配的权重
    }
    
    // 特殊处理"为什么"类查询
    if (queryLower.includes('为什么') && textLower.includes('为什么')) {
      bonus += 0.8; // 高权重匹配"为什么"开头的内容
    }
    
    // 分词匹配
    const queryTerms = this.tokenize(cleanedQuery || queryLower);
    const matchedTerms = queryTerms.filter(term => {
      if (term.length < 2) return false; // 忽略单字符
      return textLower.includes(term);
    });
    
    if (queryTerms.length > 0) {
      bonus += (matchedTerms.length / queryTerms.length) * 0.3;
    }
    
    // 标题匹配加分
    if (text.length < 100 && matchedTerms.length > 0) {
      bonus += 0.2; // 短文本（可能是标题）匹配加分
    }
    
    return bonus;
  }
  
  /**
   * 获取相关性描述
   */
  private getRelevanceDescription(similarity: number): string {
    if (similarity > 0.7) return '高度相关';
    if (similarity > 0.4) return '中度相关';
    if (similarity > 0.2) return '低度相关';
    return '可能相关';
  }
  
  /**
   * 生成智能回答
   */
  async generateAnswer(query: string, pdfTitle: string = '', mode: 'high' | 'fast' = 'high', locale: string = 'zh'): Promise<string> {
    try {
      console.log(`[RAG] 开始生成答案: "${query}", 模式: ${mode}`);
      
      // 1. 检索相关内容
      const relevantChunks = await this.searchRelevantChunks(query, 3);
      
      // 2. 评估检索质量
      const contentQuality = this.evaluateContentQuality(query, relevantChunks);
      console.log(`[RAG] 内容质量评估: ${contentQuality.quality}, 置信度: ${contentQuality.confidence}`);
      
      let answer: string;
      
      // 3. 根据质量选择回答模式
      if (contentQuality.quality === 'high') {
        // 高质量匹配：基于PDF内容回答
        const context = this.buildContext(query, relevantChunks, pdfTitle);
        answer = this.generateContextualAnswer(context);
        console.log('[RAG] 使用PDF内容生成回答');
      } else if (contentQuality.quality === 'medium') {
        // 中等质量：混合模式（PDF内容 + AI补充）
        answer = await this.generateHybridAnswer(query, relevantChunks, pdfTitle, mode, locale);
        console.log('[RAG] 使用混合模式生成回答');
      } else {
        // 低质量：使用AI通用知识回答
        answer = await this.generateAIAnswer(query, pdfTitle, mode, locale);
        console.log('[RAG] 使用AI通用知识生成回答');
      }
      
      // 4. 添加到对话历史
      this.conversationHistory.push(
        { role: 'user', content: query },
        { role: 'assistant', content: answer }
      );
      
      // 保持对话历史在合理长度
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }
      
      return answer;
      
    } catch (error) {
      console.error('[RAG] 生成答案失败:', error);
      return this.generateFallbackAnswer(query, locale);
    }
  }
  
  /**
   * 构建对话上下文
   */
  private buildContext(query: string, relevantChunks: SearchResult[], pdfTitle: string): ConversationContext {
    return {
      query,
      relevantChunks,
      conversationHistory: this.conversationHistory.slice(-6), // 最近3轮对话
      pdfMetadata: {
        title: pdfTitle,
        totalPages: Math.max(...this.chunks.map(c => c.pageNumber), 0),
        language: this.detectLanguage(this.chunks.map(c => c.text).join(' '))
      }
    };
  }
  
  /**
   * 检测文档语言
   */
  private detectLanguage(text: string): 'zh' | 'en' | 'mixed' {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const total = chineseChars + englishChars;
    
    if (total === 0) return 'mixed';
    
    const chineseRatio = chineseChars / total;
    if (chineseRatio > 0.8) return 'zh';
    if (chineseRatio < 0.2) return 'en';
    return 'mixed';
  }
  
  /**
   * 基于上下文生成回答
   */
  private generateContextualAnswer(context: ConversationContext): string {
    const { query, relevantChunks, pdfMetadata } = context;
    
    // 检查查询类型
    const queryType = this.classifyQuery(query);
    
    switch (queryType) {
      case 'definition':
        return this.generateDefinitionAnswer(query, relevantChunks);
      case 'summary':
        return this.generateSummaryAnswer(query, relevantChunks);
      case 'page_location':
        return this.generateLocationAnswer(query, relevantChunks);
      case 'comparison':
        return this.generateComparisonAnswer(query, relevantChunks);
      case 'how_to':
        return this.generateHowToAnswer(query, relevantChunks);
      default:
        return this.generateGeneralAnswer(query, relevantChunks);
    }
  }
  
  /**
   * 查询分类
   */
  private classifyQuery(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (/什么是|定义|概念|含义/.test(lowerQuery)) return 'definition';
    if (/总结|概述|摘要|归纳/.test(lowerQuery)) return 'summary';
    if (/在第?几页|第?.*页|页码/.test(lowerQuery)) return 'page_location';
    if (/区别|不同|对比|比较/.test(lowerQuery)) return 'comparison';
    if (/如何|怎么|怎样|步骤|方法/.test(lowerQuery)) return 'how_to';
    
    return 'general';
  }
  
  /**
   * 生成定义类回答
   */
  private generateDefinitionAnswer(query: string, chunks: SearchResult[]): string {
    if (chunks.length === 0) return '抱歉，在文档中没有找到相关定义。';
    
    const bestChunk = chunks[0];
    
    return `${bestChunk.chunk.text}

（第${bestChunk.chunk.pageNumber}页）`;
  }
  
  /**
   * 生成总结类回答
   */
  private generateSummaryAnswer(query: string, chunks: SearchResult[]): string {
    if (chunks.length === 0) return '抱歉，无法找到足够信息进行总结。';
    
    return `${chunks[0].chunk.text}

（第${chunks[0].chunk.pageNumber}页）`;
  }
  
  /**
   * 生成位置查询回答
   */
  private generateLocationAnswer(query: string, chunks: SearchResult[]): string {
    if (chunks.length === 0) return '抱歉，没有找到相关内容的页面位置。';
    
    const pages = [...new Set(chunks.map(c => c.chunk.pageNumber))].sort((a, b) => a - b);
    const keyTerm = this.extractKeyTerm(query);
    
    if (pages.length === 1) {
      return `"${keyTerm}"在第${pages[0]}页。

${chunks[0].chunk.text}`;
    } else {
      // 多页结果，显示主要页面
      const mainPage = chunks[0].chunk.pageNumber;
      return `"${keyTerm}"主要在第${mainPage}页，也出现在第${pages.filter(p => p !== mainPage).join('、')}页。

${chunks[0].chunk.text}`;
    }
  }
  
  /**
   * 生成对比类回答
   */
  private generateComparisonAnswer(query: string, chunks: SearchResult[]): string {
    if (chunks.length < 2) return '抱歉，没有找到足够的信息进行对比分析。';
    
    return `${chunks[0].chunk.text}

（第${chunks[0].chunk.pageNumber}页）`;
  }
  
  /**
   * 生成操作指南回答
   */
  private generateHowToAnswer(query: string, chunks: SearchResult[]): string {
    if (chunks.length === 0) return '抱歉，没有找到相关的操作指南。';
    
    return `${chunks[0].chunk.text}

（第${chunks[0].chunk.pageNumber}页）`;
  }
  
  /**
   * 生成通用回答
   */
  private generateGeneralAnswer(query: string, chunks: SearchResult[]): string {
    if (chunks.length === 0) return '抱歉，没有找到相关信息。您可以尝试用不同的关键词提问。';
    
    const bestChunk = chunks[0];
    
    return `${bestChunk.chunk.text}

（第${bestChunk.chunk.pageNumber}页）`;
  }
  
  /**
   * 提取关键词
   */
  private extractKeyTerm(query: string): string {
    const terms = query.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    return terms.find(term => term.length > 1) || '相关内容';
  }
  
  /**
   * 提取步骤信息
   */
  private extractSteps(text: string): string[] {
    const stepPatterns = [
      /\d+[、.]\s*([^。\n]+)/g,
      /[一二三四五六七八九十]+[、.]\s*([^。\n]+)/g,
      /(git\s+\w+[^。\n]*)/gi
    ];
    
    const steps: string[] = [];
    
    for (const pattern of stepPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 5) {
          steps.push(match[1].trim());
        }
      }
    }
    
    return steps.slice(0, 8); // 最多8个步骤
  }
  
  /**
   * 评估检索内容质量
   */
  private evaluateContentQuality(query: string, chunks: SearchResult[]): {quality: 'high' | 'medium' | 'low', confidence: number, reason: string} {
    if (chunks.length === 0) {
      return { quality: 'low', confidence: 0, reason: '未找到相关内容' };
    }

    const bestChunk = chunks[0];
    const similarity = bestChunk.similarity;
    
    // 计算内容质量指标
    const queryTerms = this.tokenize(query.toLowerCase());
    const contentTerms = this.tokenize(bestChunk.chunk.text.toLowerCase());
    const matchedTerms = queryTerms.filter(term => contentTerms.includes(term));
    const termMatchRatio = matchedTerms.length / queryTerms.length;
    
    // 检查内容长度和完整性
    const contentLength = bestChunk.chunk.text.length;
    const hasCompleteInfo = contentLength > 50 && (
      bestChunk.chunk.text.includes('。') || 
      bestChunk.chunk.text.includes('.') ||
      bestChunk.chunk.text.includes(':') ||
      bestChunk.chunk.text.includes('：')
    );
    
    // 特殊查询类型检测
    const isSpecificTechnicalQuery = /命令|代码|如何|怎么|步骤|方法|操作/.test(query);
    const hasRelevantKeywords = isSpecificTechnicalQuery && matchedTerms.some(term => 
      /git|head|branch|commit|checkout|reset|log/.test(term)
    );
    
    let confidence = similarity;
    let quality: 'high' | 'medium' | 'low';
    let reason: string;
    
    if (similarity >= 0.7 && termMatchRatio >= 0.6 && hasCompleteInfo) {
      quality = 'high';
      confidence = Math.min(0.95, confidence + 0.2);
      reason = '高度匹配：相似度高且内容完整';
    } else if (similarity >= 0.4 && termMatchRatio >= 0.3) {
      quality = 'medium';
      reason = '中度匹配：部分相关但需要补充';
    } else if (isSpecificTechnicalQuery && !hasRelevantKeywords) {
      quality = 'low';
      confidence = 0.1;
      reason = '技术问题但PDF中缺少相关信息';
    } else if (similarity < 0.3) {
      quality = 'low';
      reason = '低度匹配：相关性不足';
    } else {
      quality = 'medium';
      reason = '中度匹配：有一定相关性';
    }
    
    return { quality, confidence, reason };
  }

  /**
   * 生成混合回答（PDF内容 + AI补充）
   */
  private async generateHybridAnswer(query: string, chunks: SearchResult[], pdfTitle: string, mode: 'high' | 'fast' = 'high', locale: string = 'zh'): Promise<string> {
    const pdfContent = chunks.map(chunk => 
      `【${pdfTitle}第${chunk.chunk.pageNumber}页】${chunk.chunk.text}`
    ).join('\n\n');
    
    const languageInstruction = getLanguageInstruction(locale);
    
    const prompt = `${languageInstruction}

基于PDF内容回答用户问题，如内容不足可补充相关知识。

PDF内容：
${pdfContent}

用户问题：${query}

回答要求：
- 简洁准确，避免冗长解释
- 优先使用PDF内容，不足时补充通用知识
- 如有页码引用请保留【页码】格式`;

    return await this.callAIService(prompt, mode, locale);
  }

  /**
   * 生成AI通用知识回答
   */
  private async generateAIAnswer(query: string, pdfTitle: string, mode: 'high' | 'fast' = 'high', locale: string = 'zh'): Promise<string> {
    const languageInstruction = getLanguageInstruction(locale);
    
    const prompt = `${languageInstruction}

用户询问：${query}

当前PDF文档《${pdfTitle}》中未找到相关内容，请基于通用知识简洁回答。

回答要求：
- 简洁准确，直接回答要点
- 可适当使用代码示例
- 开头说明"此问题在当前文档中未找到相关内容，以下基于通用知识回答："`;

    return await this.callAIService(prompt, mode, locale);
  }

  /**
   * 调用AI服务
   */
  private async callAIService(prompt: string, mode: 'high' | 'fast' = 'high', locale: string = 'zh'): Promise<string> {
    try {
      // 获取语言指令
      const languageInstruction = getLanguageInstruction(locale);
      
      // 构建强化的系统提示词
      let systemPrompt = `你是一个专业的技术助手，擅长解答各种技术问题。${languageInstruction}`;
      let finalPrompt = `${languageInstruction}\n\n${prompt}`;
      
      if (mode === 'fast') {
        systemPrompt = `你是一个简洁高效的助手。回答要极度精简，直接给出关键信息，避免任何多余解释。使用要点形式，省略客套语。${languageInstruction}`;
        finalPrompt = `${languageInstruction}\n\n${prompt}\n\n【重要】：请用最简短的语言回答，直接给出要点，不要解释过程，省略所有客套语。`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
          'X-Title': 'Maoge PDF Chat'
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat-v3-0324:free",
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: finalPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[RAG] AI服务HTTP错误: ${response.status} - ${errorText}`);
        throw new Error(`AI服务错误: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[RAG] AI服务响应:', JSON.stringify(data, null, 2));
      
      const aiResponse = data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        console.error('[RAG] AI响应格式异常:', data);
        throw new Error('AI未返回有效响应');
      }

      return aiResponse;
    } catch (error) {
      console.error('[RAG] AI服务调用失败:', error);
      return this.generateFallbackAnswer('', locale);
    }
  }

  /**
   * 生成后备回答
   */
  private generateFallbackAnswer(query: string, locale: string = 'zh'): string {
    const fallbacksByLocale = {
      'zh': [
        '抱歉，我暂时无法回答这个问题。请尝试用不同的关键词提问，或者检查网络连接。',
        '系统暂时遇到问题，请稍后重试或尝试更具体的问题。',
        '抱歉，无法处理您的问题。您可以尝试重新表述问题或联系技术支持。'
      ],
      'en': [
        'Sorry, I cannot answer this question at the moment. Please try asking with different keywords or check your network connection.',
        'The system is temporarily experiencing issues. Please try again later or ask a more specific question.',
        'Sorry, I cannot process your question. You can try rephrasing it or contact technical support.'
      ],
      'ko': [
        '죄송합니다. 지금은 이 질문에 답할 수 없습니다. 다른 키워드로 질문하거나 네트워크 연결을 확인해 주세요.',
        '시스템에 일시적인 문제가 발생했습니다. 나중에 다시 시도하거나 더 구체적인 질문을 해주세요.',
        '죄송합니다. 귀하의 질문을 처리할 수 없습니다. 질문을 다시 표현하거나 기술 지원에 문의하세요.'
      ],
      'ja': [
        '申し訳ありませんが、現在この質問にお答えできません。異なるキーワードで質問するか、ネットワーク接続を確認してください。',
        'システムに一時的な問題が発生しています。後でもう一度お試しいただくか、より具体的な質問をしてください。',
        '申し訳ありませんが、ご質問を処理できません。質問を言い換えるか、テクニカルサポートにお問い合わせください。'
      ],
      'es': [
        'Lo siento, no puedo responder esta pregunta en este momento. Intenta preguntar con palabras clave diferentes o verifica tu conexión de red.',
        'El sistema está experimentando problemas temporales. Inténtalo de nuevo más tarde o haz una pregunta más específica.',
        'Lo siento, no puedo procesar tu pregunta. Puedes intentar reformularla o contactar al soporte técnico.'
      ],
      'fr': [
        'Désolé, je ne peux pas répondre à cette question pour le moment. Essayez de poser la question avec des mots-clés différents ou vérifiez votre connexion réseau.',
        'Le système rencontre temporairement des problèmes. Veuillez réessayer plus tard ou poser une question plus spécifique.',
        'Désolé, je ne peux pas traiter votre question. Vous pouvez essayer de la reformuler ou contacter le support technique.'
      ],
      'de': [
        'Entschuldigung, ich kann diese Frage momentan nicht beantworten. Versuchen Sie es mit anderen Stichwörtern oder überprüfen Sie Ihre Netzverbindung.',
        'Das System hat vorübergehend Probleme. Bitte versuchen Sie es später erneut oder stellen Sie eine spezifischere Frage.',
        'Entschuldigung, ich kann Ihre Frage nicht verarbeiten. Sie können versuchen, sie umzuformulieren oder den technischen Support zu kontaktieren.'
      ],
      'it': [
        'Mi dispiace, al momento non posso rispondere a questa domanda. Prova a chiedere con parole chiave diverse o controlla la tua connessione di rete.',
        'Il sistema sta riscontrando problemi temporanei. Riprova più tardi o fai una domanda più specifica.',
        'Mi dispiace, non posso elaborare la tua domanda. Puoi provare a riformularla o contattare il supporto tecnico.'
      ],
      'pt-BR': [
        'Desculpe, não posso responder a esta pergunta no momento. Tente perguntar com palavras-chave diferentes ou verifique sua conexão de rede.',
        'O sistema está enfrentando problemas temporários. Tente novamente mais tarde ou faça uma pergunta mais específica.',
        'Desculpe, não posso processar sua pergunta. Você pode tentar reformulá-la ou entrar em contato com o suporte técnico.'
      ],
      'ru': [
        'Извините, я не могу ответить на этот вопрос в данный момент. Попробуйте задать вопрос с другими ключевыми словами или проверьте подключение к сети.',
        'В системе временные проблемы. Попробуйте еще раз позже или задайте более конкретный вопрос.',
        'Извините, я не могу обработать ваш вопрос. Вы можете попробовать переформулировать его или обратиться в техническую поддержку.'
      ],
      'hi': [
        'खुशफ़हमी, मैं इस समय इस सवाल का जवाब नहीं दे सकता। अलग कीवर्ड के साथ पूछने की कोशिश करें या अपने नेटवर्क कनेक्शन की जांच करें।',
        'सिस्टम में अस्थायी समस्याएं हैं। बाद में फिर कोशिश करें या अधिक विशिष्ट सवाल पूछें।',
        'खुशफ़हमी, मैं आपके सवाल को प्रोसेस नहीं कर सकता। आप इसे दोबारा शब्दों में रखने की कोशिश कर सकते हैं या तकनीकी सहायता से संपर्क कर सकते हैं।'
      ],
      'th': [
        'ขออพัย ตอนนี้ไม่สามารถตอบคำถามนี้ได้ กรุณาลองถามด้วยคำสำคัญที่ต่างออกไป หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        'ระบบมีปัญหาชั่วคราว กรุณาลองใหม่ในภายหลัง หรือถามคำถามที่เฉพาะเจาะจงมากขึ้น',
        'ขออไว ไม่สามารถประมวลผลคำถามของคุณได้ คุณสามารถลองกลับคำถามใหม่ หรือติดต่อฝ่ายสนับสนุนเทคนิค'
      ],
      'vi': [
        'Xin lỗi, tôi không thể trả lời câu hỏi này lúc này. Hãy thử hỏi với từ khóa khác hoặc kiểm tra kết nối mạng.',
        'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau hoặc đặt câu hỏi cụ thể hơn.',
        'Xin lỗi, tôi không thể xử lý câu hỏi của bạn. Bạn có thể thử diễn đạt lại hoặc liên hệ hỗ trợ kỹ thuật.'
      ],
      'tr': [
        'Üzgünüm, şu anda bu soruyu yanıtlayamıyorum. Farklı anahtar kelimelerle sormayı deneyin veya ağ bağlantınızı kontrol edin.',
        'Sistem geçici sorunlar yaşıyor. Lütfen daha sonra tekrar deneyin veya daha spesifik bir soru sorun.',
        'Üzgünüm, sorunuzu işleyemiyorum. Yeniden ifade etmeyi deneyebilir veya teknik destek ile iletişime geçebilirsiniz.'
      ],
      'ar': [
        'آسف، لا أستطيع الإجابة على هذا السؤال في الوقت الحالي. حاول السؤال بكلمات مفتاحية مختلفة أو تحقق من اتصال الشبكة.',
        'النظام يواجه مشاكل مؤقتة. يرجى المحاولة مرة أخرى لاحقاً أو طرح سؤال أكثر تحديداً.',
        'آسف، لا أستطيع معالجة سؤالك. يمكنك محاولة إعادة صياغته أو الاتصال بالدعم التقني.'
      ],
      'bn': [
        'দুঃখিত, আমি এই মুহূর্তে এই প্রশ্নের উত্তর দিতে পারছি না। অন্য কীওয়ার্ড দিয়ে প্রশ্ন করার চেষ্টা করুন বা নেটওয়ার্ক সংযোগ পরীক্ষা করুন।',
        'সিস্টেমে সাময়িক সমস্যা হচ্ছে। পরে আবার চেষ্টা করুন বা আরো নির্দিষ্ট প্রশ্ন করুন।',
        'দুঃখিত, আমি আপনার প্রশ্ন প্রক্রিয়া করতে পারছি না। আপনি এটি পুনরায় বাক্যে রাখার চেষ্টা করতে পারেন বা প্রযুক্তিগত সহায়তার সাথে যোগাযোগ করতে পারেন।'
      ],
      'da': [
        'Undskyld, jeg kan ikke besvare dette spørgsmål lige nu. Prøv at spørge med andre nøgleord eller tjek din netværksforbindelse.',
        'Systemet oplever midlertidige problemer. Prøv igen senere eller stil et mere specifikt spørgsmål.',
        'Undskyld, jeg kan ikke behandle dit spørgsmål. Du kan prøve at omformulere det eller kontakte teknisk support.'
      ],
      'fi': [
        'Anteeksi, en voi vastata tähän kysymykseen tällä hetkellä. Kokeile kysyä eri avainsanoilla tai tarkista verkkoyhteytesi.',
        'Järjestelmässä on tilapäisiä ongelmia. Yritä myöhemmin uudelleen tai esitä tarkempi kysymys.',
        'Anteeksi, en voi käsitellä kysymystäsi. Voit yrittää muotoilla sen uudelleen tai ottaa yhteyttä tekniseen tukeen.'
      ],
      'id': [
        'Maaf, saya tidak dapat menjawab pertanyaan ini saat ini. Coba tanyakan dengan kata kunci yang berbeda atau periksa koneksi jaringan Anda.',
        'Sistem mengalami masalah sementara. Silakan coba lagi nanti atau ajukan pertanyaan yang lebih spesifik.',
        'Maaf, saya tidak dapat memproses pertanyaan Anda. Anda dapat mencoba merumuskannya kembali atau menghubungi dukungan teknis.'
      ],
      'kn': [
        'ಕ್ಷಮಿಸಿ, ಈ ಸಮಯದಲ್ಲಿ ನಾನು ಈ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ವಿಭಿನ್ನ ಮುಖ್ಯಪದಗಳೊಂದಿಗೆ ಕೇಳಲು ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ನಿಮ್ಮ ನೆಟ್‌ವರ್ಕ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.',
        'ಸಿಸ್ಟಂ ತಾತ್ಕಾಲಿಕ ಸಮಸ್ಯೆಗಳನ್ನು ಎದುರಿಸುತ್ತಿದೆ. ದಯವಿಟ್ಟು ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಹೆಚ್ಚು ನಿರ್ದಿಷ್ಟ ಪ್ರಶ್ನೆ ಕೇಳಿ.',
        'ಕ್ಷಮಿಸಿ, ನಾನು ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ನೀವು ಅದನ್ನು ಮರುಹೇಳಲು ಪ್ರಯತ್ನಿಸಬಹುದು ಅಥವಾ ತಾಂತ್ರಿಕ ಬೆಂಬಲವನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು.'
      ],
      'ms': [
        'Maaf, saya tidak dapat menjawab soalan ini pada masa ini. Cuba tanya dengan kata kunci yang berbeza atau periksa sambungan rangkaian anda.',
        'Sistem mengalami masalah sementara. Sila cuba lagi kemudian atau tanya soalan yang lebih spesifik.',
        'Maaf, saya tidak dapat memproses soalan anda. Anda boleh cuba merumuskannya semula atau hubungi sokongan teknikal.'
      ],
      'nl': [
        'Sorry, ik kan deze vraag op dit moment niet beantwoorden. Probeer te vragen met andere trefwoorden of controleer uw netwerkverbinding.',
        'Het systeem ondervindt tijdelijke problemen. Probeer het later opnieuw of stel een meer specifieke vraag.',
        'Sorry, ik kan uw vraag niet verwerken. U kunt proberen het te herformuleren of contact opnemen met technische ondersteuning.'
      ],
      'no': [
        'Beklager, jeg kan ikke svare på dette spørsmålet akkurat nå. Prøv å spørre med andre nøkkelord eller sjekk nettverkstilkoblingen din.',
        'Systemet opplever midlertidige problemer. Prøv igjen senere eller still et mer spesifikt spørsmål.',
        'Beklager, jeg kan ikke behandle spørsmålet ditt. Du kan prøve å omformulere det eller kontakte teknisk støtte.'
      ],
      'pa': [
        'ਮਾਫ਼ ਕਰਨਾ, ਮੈਂ ਇਸ ਸਮੇਂ ਇਸ ਸਵਾਲ ਦਾ ਜਵਾਬ ਨਹੀਂ ਦੇ ਸਕਦਾ। ਵੱਖਰੇ ਮੁੱਖ ਸ਼ਬਦਾਂ ਨਾਲ ਪੁੱਛਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਆਪਣੇ ਨੈੱਟਵਰਕ ਕੁਨੈਕਸ਼ਨ ਦੀ ਜਾਂਚ ਕਰੋ।',
        'ਸਿਸਟਮ ਵਿੱਚ ਅਸਥਾਈ ਸਮੱਸਿਆਵਾਂ ਹਨ। ਬਾਅਦ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ ਵਧੇਰੇ ਖਾਸ ਸਵਾਲ ਪੁੱਛੋ।',
        'ਮਾਫ਼ ਕਰਨਾ, ਮੈਂ ਤੁਹਾਡੇ ਸਵਾਲ ਦੀ ਪ੍ਰਕਿਰਿਆ ਨਹੀਂ ਕਰ ਸਕਦਾ। ਤੁਸੀਂ ਇਸਨੂੰ ਦੁਬਾਰਾ ਸ਼ਬਦਾਂ ਵਿੱਚ ਰੱਖਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰ ਸਕਦੇ ਹੋ ਜਾਂ ਤਕਨੀਕੀ ਸਹਾਇਤਾ ਨਾਲ ਸੰਪਰਕ ਕਰ ਸਕਦੇ ਹੋ।'
      ],
      'pl': [
        'Przepraszam, nie mogę odpowiedzieć na to pytanie w tej chwili. Spróbuj zapytać używając innych słów kluczowych lub sprawdź połączenie z siecią.',
        'System napotyka tymczasowe problemy. Spróbuj ponownie później lub zadaj bardziej konkretne pytanie.',
        'Przepraszam, nie mogę przetworzyć twojego pytania. Możesz spróbować je przeformułować lub skontaktować się z pomocą techniczną.'
      ],
      'sv': [
        'Förlåt, jag kan inte svara på denna fråga just nu. Försök fråga med andra nyckelord eller kontrollera din nätverksanslutning.',
        'Systemet upplever tillfälliga problem. Försök igen senare eller ställ en mer specifik fråga.',
        'Förlåt, jag kan inte bearbeta din fråga. Du kan försöka omformulera den eller kontakta teknisk support.'
      ]
    };
    
    const fallbacks = fallbacksByLocale[locale as keyof typeof fallbacksByLocale] || fallbacksByLocale['en'];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
  
  /**
   * 获取文档统计信息
   */
  getDocumentStats(): {
    totalChunks: number;
    totalPages: number;
    averageChunkLength: number;
    titleCount: number;
  } {
    return {
      totalChunks: this.chunks.length,
      totalPages: Math.max(...this.chunks.map(c => c.pageNumber), 0),
      averageChunkLength: this.chunks.reduce((sum, chunk) => sum + chunk.text.length, 0) / this.chunks.length,
      titleCount: this.chunks.filter(chunk => chunk.metadata.isTitle).length
    };
  }
  
  /**
   * 清理搜索缓存
   */
  clearSearchCache(): void {
    this.searchCache.clear();
    console.log('[RAG] 搜索缓存已清理');
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { cacheSize: number, maxSize: number, hitRate?: number } {
    return {
      cacheSize: this.searchCache.size,
      maxSize: this.cacheMaxSize
    };
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.chunks = [];
    this.embeddings.clear();
    this.conversationHistory = [];
    this.searchCache.clear();
    this.lastProcessedPdfUrl = '';
    console.log('[RAG] 系统已清理');
  }
}

// 导出单例实例
export const pdfRAGSystem = new PDFRAGSystem();