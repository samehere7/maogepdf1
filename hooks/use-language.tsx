"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "en" | "zh" | "ja"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Header & Navigation
    features: "Features",
    pricing: "Pricing",
    help: "Help",
    uploadPdf: "Upload PDF",
    myLibrary: "My Library",
    explore: "Explore",
    upgrade: "Upgrade",
    overview: "Overview",

    // Home Page
    oneLineDescription: "One sentence to summarize",
    heroDescription: "Your PDF AI - just like MaogePDF, but for PDFs. Generate summaries and answer questions for free.",
    heroTitle: "Drag and drop a PDF for AI-powered analysis and quick summarization.",
    heroSubtitle:
      "Effortlessly extract insights and summarize key information from your PDFs with our advanced AI technology.",
    clickToUpload: "Click to upload",
    orDragAndDrop: "or drag and drop",
    pdfMaxSize: "PDF",
    uploading: "Uploading...",
    heroTitleV2: "Chat with any PDF",
    heroDescriptionV2: "Join millions of students, researchers and professionals to instantly answer questions and understand research with AI",

    // Analysis Page
    documentAnalysis: "Document Analysis",
    documentAnalysisResults: "Document Analysis Results",
    aiPoweredAnalysis: "AI-powered analysis of your uploaded PDF.",
    documentTheme: "Document Theme",
    mainPoints: "Main Points",
    conclusions: "Conclusions",
    reference: "Reference",
    downloadSummary: "Download Summary",
    analyzingDocument: "Analyzing document...",

    // Chat
    chatWithDocument: "Maoge with Document",
    chatWelcomeMessage: "Hello! I'm here to help you understand {documentName}. Ask me anything about the document!",
    askAboutDocument: "Ask about the document...",
    typing: "AI is typing...",
    chatErrorMessage: "Sorry, I encountered an error. Please try again.",

    // Account Page
    account: "Account",
    personalInformation: "Personal Information",
    name: "Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    updateInformation: "Update Information",
    myPdfs: "My PDFs",
    dateAnalyzed: "Date Analyzed",
    actions: "Actions",
    viewAnalysis: "View Analysis",
    noPdfsUploaded: "No PDFs uploaded yet",
    subscription: "Subscription",
    currentPlan: "Current Plan",
    status: "Status",
    nextBillingDate: "Next Billing Date",
    manageSubscription: "Manage Subscription",
    premiumMonthly: "Premium Monthly",
    active: "Active",
    informationUpdated: "Information updated successfully!",

    // Login/Register
    login: "Login",
    register: "Register",
    loggingIn: "Logging in...",
    registering: "Registering...",
    enterYourEmail: "Enter your email",
    enterYourName: "Enter your name",
    enterNewPassword: "Enter new password (optional)",
    forgotPassword: "Forgot Password?",
    logout: "Logout",

    // Pricing Page
    pricingTitle: "Choose the plan that's right for you",
    pricingSubtitle: "Simple, transparent pricing. No hidden fees. Upgrade, downgrade, or cancel anytime.",
    free: "Free",
    pro: "Pro",
    team: "Team",
    month: "month",
    mostPopular: "Most Popular",
    getStarted: "Get Started",
    freeDescription: "For individuals just getting started.",
    proDescription: "For professionals and power users.",
    teamDescription: "For collaborative work and organizations.",
    freeFeature1: "5 PDFs/month",
    freeFeature2: "50 pages/PDF",
    freeFeature3: "Basic features",
    proFeature1: "Unlimited PDFs",
    proFeature2: "Unlimited pages",
    proFeature3: "Advanced features",
    proFeature4: "Priority support",
    teamFeature1: "Unlimited PDFs",
    teamFeature2: "Unlimited pages",
    teamFeature3: "Advanced features",
    teamFeature4: "Priority support",
    teamFeature5: "Team collaboration",
    faq: "Frequently Asked Questions",
    faqQuestion1: "What is Maoge PDF?",
    faqAnswer1:
      "Maoge PDF is an AI-powered tool that allows you to analyze and summarize PDF documents efficiently. It uses advanced algorithms to extract key information and provide concise summaries, saving you time and effort.",
    faqQuestion2: "How does the pricing work?",
    faqAnswer2:
      "We offer a range of subscription plans to suit different needs. You can choose between monthly or annual billing. The Free plan has limitations on usage, while paid plans offer more features and higher limits. Visit our pricing section for a detailed comparison.",
    faqQuestion3: "Can I cancel my subscription?",
    faqAnswer3:
      "Yes, you can cancel your subscription at any time. If you cancel, you will continue to have access to your plan's features until the end of your current billing period. No refunds are provided for partial billing periods.",

    // Sidebar Navigation
    home: "Home",

    // Footer
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    contactUs: "Contact Us",
    allRightsReserved: "All rights reserved.",

    // Messages
    onlyPdfAllowed: "Only PDF files are allowed",
    fileSizeLimit: "File size must be under 10MB",
    uploadError: "Upload failed. Please try again.",

    // Features Section
    featuresTitle: "Unlock the Power of Your PDFs",
    featuresSubtitle:
      "Maoge PDF helps you extract insights, answer questions, and save time with AI-powered document analysis.",
    forResearchers: "For Researchers",
    researchersDescription:
      "Browse academic papers, journals and books, for the information you need in your research.",
    researchersFeature1: "Extract citations and references with proper formatting",
    researchersFeature2: "Identify methodology details and research findings",
    researchersFeature3: "Compare information across multiple research papers",
    researchersImageAlt: "Researcher analyzing documents",
    forStudents: "For Students",
    studentsDescription:
      "Prepare for exams, complete assignments, and let your classmates quickly find answers to questions.",
    studentsFeature1: "Quickly find answers to specific questions in textbooks",
    studentsFeature2: "Generate study notes and summaries from course materials",
    studentsFeature3: "Properly cite sources in assignments and papers",
    studentsImageAlt: "Student studying with digital notes",
    forProfessionals: "For Professionals",
    professionalsDescription:
      "Quickly process legal contracts, financial reports, manuals and training materials. Ask any PDF questions and get instant answers.",
    professionalsFeature1: "Quickly analyze lengthy reports and extract key points",
    professionalsFeature2: "Get answers to specific questions about contracts or policies",
    professionalsFeature3: "Generate summaries of meetings and presentations",
    professionalsImageAlt: "Professional analyzing business documents",
    citationSources: "Citation Sources",
    citationDescription:
      "Built-in citation feature that links answers to specific pages in the PDF, making it easy to find sources.",
  },
  zh: {
    // Header & Navigation
    features: "功能",
    pricing: "定价",
    help: "帮助",
    uploadPdf: "上传PDF",
    myLibrary: "我的文档库",
    explore: "探索",
    upgrade: "升级",
    overview: "概览",

    // Home Page
    oneLineDescription: "一句话概括",
    heroDescription: "你的 PDF AI——就像 ChatGPT，但专为PDF而生。可免费生成摘要并回答问题",
    heroTitle: "拖放PDF文件进行AI驱动的分析和快速摘要。",
    heroSubtitle: "使用我们先进的AI技术轻松提取见解并总结PDF中的关键信息。",
    clickToUpload: "点击上传",
    orDragAndDrop: "或拖拽文件",
    pdfMaxSize: "PDF",
    uploading: "上传中...",
    heroTitleV2: "与任意 PDF 聊天",
    heroDescriptionV2: "数百万学生、研究者和专业人士都在用，立即用 AI 回答问题、理解论文和资料",

    // Analysis Page
    documentAnalysis: "文档分析",
    documentAnalysisResults: "文档分析结果",
    aiPoweredAnalysis: "AI驱动的PDF文档分析。",
    documentTheme: "文档主题",
    mainPoints: "主要观点",
    conclusions: "结论",
    reference: "参考",
    downloadSummary: "下载摘要",
    analyzingDocument: "正在分析文档...",

    // Chat
    chatWithDocument: "与文档猫哥",
    chatWelcomeMessage: "您好！我在这里帮助您理解 {documentName}。请随时询问有关文档的任何问题！",
    askAboutDocument: "询问有关文档的问题...",
    typing: "AI正在输入...",
    chatErrorMessage: "抱歉，我遇到了错误。请重试。",

    // Account Page
    account: "账户",
    personalInformation: "个人信息",
    name: "姓名",
    email: "邮箱",
    password: "密码",
    confirmPassword: "确认密码",
    updateInformation: "更新信息",
    myPdfs: "我的PDF文档",
    dateAnalyzed: "分析日期",
    actions: "操作",
    viewAnalysis: "查看分析",
    noPdfsUploaded: "尚未上传PDF文档",
    subscription: "订阅",
    currentPlan: "当前套餐",
    status: "状态",
    nextBillingDate: "下次扣费日期",
    manageSubscription: "管理订阅",
    premiumMonthly: "高级月套餐",
    active: "活跃",
    informationUpdated: "信息更新成功！",

    // Login/Register
    login: "登录",
    register: "注册",
    loggingIn: "登录中...",
    registering: "注册中...",
    enterYourEmail: "输入您的邮箱",
    enterYourName: "输入您的姓名",
    enterNewPassword: "输入新密码（可选）",
    forgotPassword: "忘记密码？",
    logout: "退出登录",

    // Pricing Page
    pricingTitle: "选择适合您的套餐",
    pricingSubtitle: "简单透明的定价。无隐藏费用。随时升级、降级或取消。",
    free: "免费",
    pro: "专业版",
    team: "团队版",
    month: "月",
    mostPopular: "最受欢迎",
    getStarted: "开始使用",
    freeDescription: "适合刚开始使用的个人用户。",
    proDescription: "适合专业人士和高级用户。",
    teamDescription: "适合协作工作和组织。",
    freeFeature1: "每月5个PDF",
    freeFeature2: "每个PDF 50页",
    freeFeature3: "基础功能",
    proFeature1: "无限PDF",
    proFeature2: "无限页数",
    proFeature3: "高级功能",
    proFeature4: "优先支持",
    teamFeature1: "无限PDF",
    teamFeature2: "无限页数",
    teamFeature3: "高级功能",
    teamFeature4: "优先支持",
    teamFeature5: "团队协作",
    faq: "常见问题",
    faqQuestion1: "什么是猫哥PDF？",
    faqAnswer1:
      "猫哥PDF是一个AI驱动的工具，允许您高效地分析和总结PDF文档。它使用先进的算法提取关键信息并提供简洁的摘要，为您节省时间和精力。",
    faqQuestion2: "定价如何运作？",
    faqAnswer2:
      "我们提供一系列订阅套餐以满足不同需求。您可以选择月付或年付。免费套餐有使用限制，而付费套餐提供更多功能和更高限制。请访问我们的定价部分了解详细比较。",
    faqQuestion3: "我可以取消订阅吗？",
    faqAnswer3:
      "是的，您可以随时取消订阅。如果您取消，您将继续享有套餐功能直到当前计费周期结束。部分计费周期不提供退款。",

    // Sidebar Navigation
    home: "首页",

    // Footer
    termsOfService: "服务条款",
    privacyPolicy: "隐私政策",
    contactUs: "联系我们",
    allRightsReserved: "版权所有。",

    // Messages
    onlyPdfAllowed: "只允许PDF文件",
    fileSizeLimit: "文件大小必须小于10MB",
    uploadError: "上传失败，请重试。",

    // Features Section
    featuresTitle: "释放PDF文档的力量",
    featuresSubtitle: "猫哥PDF帮助您通过AI驱动的文档分析提取见解、回答问题并节省时间。",
    forResearchers: "适合研究者",
    researchersDescription: "浏览学术论文、期刊文章和书籍，用于你的研究中需要的信息。",
    researchersFeature1: "提取格式正确的引用和参考文献",
    researchersFeature2: "识别方法细节和研究发现",
    researchersFeature3: "比较多篇研究论文中的信息",
    researchersImageAlt: "研究人员分析文档",
    forStudents: "适合大学生",
    studentsDescription: "备考复习，完成作业，并让你的同学更快地找到问题答案。",
    studentsFeature1: "在教科书中快速找到特定问题的答案",
    studentsFeature2: "从课程材料中生成学习笔记和摘要",
    studentsFeature3: "在作业和论文中正确引用来源",
    studentsImageAlt: "学生使用数字笔记学习",
    forProfessionals: "适合职场人士",
    professionalsDescription: "快速理解法律合同、财务报告、操作手册和培训资料。对任何PDF提出问题，时刻保持领先。",
    professionalsFeature1: "快速分析冗长的报告并提取关键点",
    professionalsFeature2: "获取有关合同或政策的特定问题的答案",
    professionalsFeature3: "生成会议和演示的摘要",
    professionalsImageAlt: "专业人士分析商业文档",
    citationSources: "引用来源",
    citationDescription: "内置引用功能，将回答与PDF对应的页面相链接，无需翻页查找。",
  },
  ja: {
    // Header & Navigation
    features: "機能",
    pricing: "料金",
    help: "ヘルプ",
    uploadPdf: "PDFアップロード",
    myLibrary: "マイライブラリ",
    explore: "探索",
    upgrade: "アップグレード",
    overview: "概要",

    // Home Page
    oneLineDescription: "一言で要約する",
    heroDescription: "あなたのPDF AI - MaogePDFのようですが、PDF専用です。無料で要約を生成し、質問に答えます。",
    heroTitle: "PDFをドラッグアンドドロップしてAI駆動の分析と迅速な要約を行います。",
    heroSubtitle: "先進的なAI技術を使用してPDFから洞察を簡単に抽出し、重要な情報を要約します。",
    clickToUpload: "クリックしてアップロード",
    orDragAndDrop: "またはドラッグアンドドロップ",
    pdfMaxSize: "PDF",
    uploading: "アップロード中...",
    heroTitleV2: "Chat with any PDF",
    heroDescriptionV2: "Join millions of students, researchers and professionals to instantly answer questions and understand research with AI",

    // Analysis Page
    documentAnalysis: "文書分析",
    documentAnalysisResults: "文書分析結果",
    aiPoweredAnalysis: "アップロードされたPDFのAI駆動分析。",
    documentTheme: "文書テーマ",
    mainPoints: "主要ポイント",
    conclusions: "結論",
    reference: "参照",
    downloadSummary: "要約をダウンロード",
    analyzingDocument: "文書を分析中...",

    // Chat
    chatWithDocument: "文書とマオゲ",
    chatWelcomeMessage: "こんにちは！{documentName}の理解をお手伝いします。文書について何でもお聞きください！",
    askAboutDocument: "文書について質問する...",
    typing: "AIが入力中...",
    chatErrorMessage: "申し訳ありませんが、エラーが発生しました。もう一度お試しください。",

    // Account Page
    account: "アカウント",
    personalInformation: "個人情報",
    name: "名前",
    email: "メール",
    password: "パスワード",
    confirmPassword: "パスワードを確認",
    updateInformation: "情報を更新",
    myPdfs: "マイPDF",
    dateAnalyzed: "分析日",
    actions: "アクション",
    viewAnalysis: "分析を表示",
    noPdfsUploaded: "まだPDFがアップロードされていません",
    subscription: "サブスクリプション",
    currentPlan: "現在のプラン",
    status: "ステータス",
    nextBillingDate: "次回請求日",
    manageSubscription: "サブスクリプション管理",
    premiumMonthly: "プレミアム月額",
    active: "アクティブ",
    informationUpdated: "情報が正常に更新されました！",

    // Login/Register
    login: "ログイン",
    register: "登録",
    loggingIn: "ログイン中...",
    registering: "登録中...",
    enterYourEmail: "メールアドレスを入力",
    enterYourName: "お名前を入力",
    enterNewPassword: "新しいパスワードを入力（任意）",
    forgotPassword: "パスワードを忘れましたか？",
    logout: "ログアウト",

    // Pricing Page
    pricingTitle: "あなたに適したプランを選択してください",
    pricingSubtitle:
      "シンプルで透明な料金設定。隠れた費用はありません。いつでもアップグレード、ダウングレード、キャンセルが可能です。",
    free: "無料",
    pro: "プロ",
    team: "チーム",
    month: "月",
    mostPopular: "最も人気",
    getStarted: "始める",
    freeDescription: "個人で始めたばかりの方に。",
    proDescription: "プロフェッショナルやパワーユーザーに。",
    teamDescription: "共同作業や組織に。",
    freeFeature1: "月5PDF",
    freeFeature2: "PDF当たり50ページ",
    freeFeature3: "基本機能",
    proFeature1: "無制限PDF",
    proFeature2: "無制限ページ",
    proFeature3: "高度な機能",
    proFeature4: "優先サポート",
    teamFeature1: "無制限PDF",
    teamFeature2: "無制限ページ",
    teamFeature3: "高度な機能",
    teamFeature4: "優先サポート",
    teamFeature5: "チーム協力",
    faq: "よくある質問",
    faqQuestion1: "猫哥PDFとは何ですか？",
    faqAnswer1:
      "猫哥PDFは、PDF文書を効率的に分析・要約できるAI駆動ツールです。高度なアルゴリズムを使用して主要な情報を抽出し、簡潔な要約を提供し、時間と労力を節約します。",
    faqQuestion2: "料金はどのように機能しますか？",
    faqAnswer2:
      "さまざまなニーズに対応するサブスクリプションプランをご用意しています。月額または年額請求を選択できます。無料プランには使用制限がありますが、有料プランではより多くの機能と高い制限を提供します。詳細な比較については料金セクションをご覧ください。",
    faqQuestion3: "サブスクリプションをキャンセルできますか？",
    faqAnswer3:
      "はい、いつでもサブスクリプションをキャンセルできます。キャンセルした場合、現在の請求期間の終了まで、プランの機能にアクセスし続けることができます。部分的な請求期間の返金は提供されません。",

    // Sidebar Navigation
    home: "ホーム",

    // Footer
    termsOfService: "利用規約",
    privacyPolicy: "プライバシーポリシー",
    contactUs: "お問い合わせ",
    allRightsReserved: "全著作権所有。",

    // Messages
    onlyPdfAllowed: "PDFファイルのみ許可されています",
    fileSizeLimit: "ファイルサイズは10MB以下である必要があります",
    uploadError: "アップロードに失敗しました。もう一度お試しください。",

    // Features Section
    featuresTitle: "PDFの力を解き放つ",
    featuresSubtitle: "猫哥PDFは、AI駆動の文書分析で洞察を抽出し、質問に答え、時間を節約するのに役立ちます。",
    forResearchers: "研究者向け",
    researchersDescription: "学術論文、ジャーナル、書籍を閲覧し、研究に必要な情報を見つけます。",
    researchersFeature1: "適切な形式で引用と参考文献を抽出",
    researchersFeature2: "方法論の詳細と研究結果を特定",
    researchersFeature3: "複数の研究論文間で情報を比較",
    researchersImageAlt: "研究者が文書を分析している",
    forStudents: "学生向け",
    studentsDescription: "試験準備、課題完成、そしてクラスメートが質問への答えを素早く見つけられるようにします。",
    studentsFeature1: "教科書で特定の質問への回答を素早く見つける",
    studentsFeature2: "コース教材から学習ノートと要約を生成",
    studentsFeature3: "課題や論文で適切に出典を引用",
    studentsImageAlt: "デジタルノートで勉強する学生",
    forProfessionals: "専門家向け",
    professionalsDescription:
      "法的契約、財務報告、マニュアル、研修資料を迅速に処理。PDFに関する質問をして即座に回答を得ます。",
    professionalsFeature1: "長いレポートを素早く分析し、要点を抽出",
    professionalsFeature2: "契約やポリシーに関する特定の質問への回答を取得",
    professionalsFeature3: "会議やプレゼンテーションの要約を生成",
    professionalsImageAlt: "ビジネス文書を分析する専門家",
    citationSources: "引用ソース",
    citationDescription: "回答をPDFの特定のページにリンクする内蔵引用機能により、ソースを簡単に見つけられます。",
  },
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["en", "zh", "ja"].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    return translations[language]?.[key as keyof (typeof translations)["en"]] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
