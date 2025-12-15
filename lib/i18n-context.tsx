"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Locale = "en" | "ar"
type Direction = "ltr" | "rtl"

interface I18nContextType {
  locale: Locale
  direction: Direction
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const translations = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.search": "Search",
    "nav.candidates": "Candidates",
    "nav.jobs": "Jobs",
    "nav.interviews": "Interviews",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    "nav.pricing": "Pricing",

    // Landing Page
    "landing.title": "Find Top Talent Faster",
    "landing.subtitle": "AI-powered recruiting platform that connects you with the best candidates",
    "landing.cta.primary": "Get Started",
    "landing.cta.secondary": "Learn More",
    "landing.features.title": "Everything you need to hire smarter",
    "landing.features.search": "Smart Search",
    "landing.features.search.desc": "Find candidates with AI-powered semantic search",
    "landing.features.match": "AI Matching",
    "landing.features.match.desc": "Get instant match scores for every candidate",
    "landing.features.schedule": "Interview Scheduling",
    "landing.features.schedule.desc": "Coordinate interviews seamlessly",
    "landing.stats.jobs": "Active Jobs",
    "landing.stats.candidates": "Candidates",
    "landing.stats.success": "Success Rate",
    "landing.nav.features": "Features",
    "landing.nav.pricing": "Pricing",
    "landing.nav.about": "About",
    "landing.cta.transform": "Ready to transform your hiring?",
    "landing.cta.join": "Join thousands of companies using TalentHub to find and hire the best talent.",
    "landing.footer.copyright": "© 2025 TalentHub. All rights reserved.",

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.welcomeFull": "Welcome back,",
    "dashboard.subtitle": "Here's what's happening with your recruitment today.",
    "dashboard.candidates.title": "Candidate Search",
    "dashboard.candidates.subtitle": "Find the perfect candidates with AI-powered matching",
    "dashboard.search.placeholder": "Describe the candidate you're looking for...",
    "dashboard.search.button": "Search",
    "dashboard.results": "Candidates Found",
    "dashboard.results.sorted": "Sorted by match score",
    "dashboard.stats.totalJobs": "Total Jobs",
    "dashboard.stats.active": "active",
    "dashboard.stats.candidates": "Candidates",
    "dashboard.stats.pipeline": "In your pipeline",
    "dashboard.stats.applications": "Applications",
    "dashboard.stats.received": "Total received",
    "dashboard.stats.interviews": "Interviews",
    "dashboard.stats.scheduled": "Scheduled",
    "dashboard.quickActions": "Quick Actions",
    "dashboard.quickActions.subtitle": "Get started with common tasks",
    "dashboard.activity": "Recent Activity",
    "dashboard.activity.subtitle": "Latest updates in your recruitment pipeline",
    "dashboard.noActivity": "No activity yet. Start by posting your first job!",
    "dashboard.activityComingSoon": "Activity feed coming soon...",

    // Jobs
    "jobs.title": "Job Management",
    "jobs.subtitle": "Create and manage your job postings",
    "jobs.postNew": "Post New Job",
    "jobs.loading": "Loading jobs...",
    "jobs.noJobs": "No jobs posted yet",
    "jobs.noJobs.subtitle": "Get started by posting your first job opening",
    "jobs.postFirst": "Post Your First Job",
    "jobs.edit": "Edit",
    "jobs.delete": "Delete",
    "jobs.viewDetails": "View Details",
    "jobs.viewCandidates": "View Candidates",
    "jobs.status.open": "open",
    "jobs.status.closed": "closed",
    "jobs.status.draft": "draft",

    // Candidates
    "candidate.match": "Match Score",
    "candidate.view": "View Profile",
    "candidate.contact": "Contact",
    "candidate.experience": "Experience",
    "candidates.title": "Candidate Search",
    "candidates.subtitle": "Find and manage your candidate pipeline",
    "candidates.export": "Export",
    "candidates.addCandidate": "Add Candidate",
    "candidates.searchFilters": "Search & Filters",
    "candidates.searchPlaceholder": "Search by name, title, email, or skills...",
    "candidates.allExperience": "All Experience",
    "candidates.experience.0-5": "0-5 years",
    "candidates.experience.5-10": "5-10 years",
    "candidates.experience.10+": "10+ years",
    "candidates.allSkills": "All Skills",
    "candidates.activeFilters": "Active filters:",
    "candidates.clearAll": "Clear all",
    "candidates.loading": "Loading candidates...",
    "candidates.noCandidates": "No candidates yet",
    "candidates.noResults": "No candidates found",
    "candidates.noCandidates.subtitle": "Start building your candidate pipeline by adding candidates",
    "candidates.noResults.subtitle": "Try adjusting your search filters",
    "candidates.addFirst": "Add Your First Candidate",
    "candidates.found": "Candidates Found",
    "candidates.sortedByScore": "Sorted by match score",
    "candidates.addNew": "Add New Candidate",

    // Auth
    "auth.login": "Login",
    "auth.loginDescription": "Enter your email below to login to your account",
    "auth.signUp": "Sign Up",
    "auth.signUpDescription": "Create a new account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.repeatPassword": "Repeat Password",
    "auth.fullName": "Full Name",
    "auth.fullNamePlaceholder": "John Doe",
    "auth.or": "Or continue with",
    "auth.googleSignIn": "Sign in with Google",
    "auth.googleSignUp": "Sign up with Google",
    "auth.noAccount": "Don't have an account?",
    "auth.haveAccount": "Already have an account?",
    "auth.loggingIn": "Logging in...",
    "auth.creatingAccount": "Creating account...",
    "auth.error": "An error occurred",
    "auth.passwordMismatch": "Passwords do not match",
    "auth.signin": "Sign In",
    "auth.signup": "Sign Up",
    "auth.signout": "Sign Out",

    "interviews.title": "Interviews",
    "interviews.subtitle": "Manage and schedule candidate interviews",
    "interviews.schedule": "Schedule Interview",
    "interviews.upcoming": "Upcoming Interviews",
    "interviews.past": "Past Interviews",
    "interviews.noUpcoming": "No upcoming interviews",
    "interviews.noPast": "No past interviews yet",

    // Pricing
    "pricing.title": "Choose Your Plan",
    "pricing.subtitle": "Select the perfect plan for your hiring needs",
    "pricing.popular": "Most Popular",
    "pricing.month": "month",
    "pricing.getStarted": "Get Started",
    "pricing.needHelp": "Need help choosing a plan? Contact us at",
  },
  ar: {
    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.search": "البحث",
    "nav.candidates": "المرشحون",
    "nav.jobs": "الوظائف",
    "nav.interviews": "المقابلات",
    "nav.reports": "التقارير",
    "nav.settings": "الإعدادات",
    "nav.pricing": "الأسعار",

    // Landing Page
    "landing.title": "اعثر على أفضل المواهب بسرعة",
    "landing.subtitle": "منصة توظيف مدعومة بالذكاء الاصطناعي تربطك بأفضل المرشحين",
    "landing.cta.primary": "ابدأ الآن",
    "landing.cta.secondary": "اعرف المزيد",
    "landing.features.title": "كل ما تحتاجه للتوظيف الذكي",
    "landing.features.search": "بحث ذكي",
    "landing.features.search.desc": "اعثر على المرشحين باستخدام البحث الدلالي المدعوم بالذكاء الاصطناعي",
    "landing.features.match": "مطابقة بالذكاء الاصطناعي",
    "landing.features.match.desc": "احصل على درجات مطابقة فورية لكل مرشح",
    "landing.features.schedule": "جدولة المقابلات",
    "landing.features.schedule.desc": "نسق المقابلات بسلاسة",
    "landing.stats.jobs": "الوظائف النشطة",
    "landing.stats.candidates": "المرشحون",
    "landing.stats.success": "معدل النجاح",
    "landing.nav.features": "الميزات",
    "landing.nav.pricing": "الأسعار",
    "landing.nav.about": "من نحن",
    "landing.cta.transform": "هل أنت مستعد لتحويل عملية التوظيف؟",
    "landing.cta.join": "انضم إلى آلاف الشركات التي تستخدم TalentHub للعثور على أفضل المواهب وتوظيفها.",
    "landing.footer.copyright": "© 2025 TalentHub. جميع الحقوق محفوظة.",

    // Dashboard
    "dashboard.welcome": "مرحباً بعودتك",
    "dashboard.welcomeFull": "مرحباً بعودتك،",
    "dashboard.subtitle": "إليك ما يحدث في عملية التوظيف الخاصة بك اليوم.",
    "dashboard.candidates.title": "البحث عن المرشحين",
    "dashboard.candidates.subtitle": "اعثر على المرشحين المثاليين بمطابقة مدعومة بالذكاء الاصطناعي",
    "dashboard.search.placeholder": "صف المرشح الذي تبحث عنه...",
    "dashboard.search.button": "بحث",
    "dashboard.results": "مرشحون تم العثور عليهم",
    "dashboard.results.sorted": "مرتبة حسب درجة المطابقة",
    "dashboard.stats.totalJobs": "إجمالي الوظائف",
    "dashboard.stats.active": "نشط",
    "dashboard.stats.candidates": "المرشحون",
    "dashboard.stats.pipeline": "في خط الإنتاج",
    "dashboard.stats.applications": "الطلبات",
    "dashboard.stats.received": "إجمالي المستلم",
    "dashboard.stats.interviews": "المقابلات",
    "dashboard.stats.scheduled": "مجدولة",
    "dashboard.quickActions": "إجراءات سريعة",
    "dashboard.quickActions.subtitle": "ابدأ بالمهام الشائعة",
    "dashboard.activity": "النشاط الأخير",
    "dashboard.activity.subtitle": "آخر التحديثات في عملية التوظيف",
    "dashboard.noActivity": "لا يوجد نشاط بعد. ابدأ بنشر وظيفتك الأولى!",
    "dashboard.activityComingSoon": "خلاصة النشاط قريباً...",

    // Jobs
    "jobs.title": "إدارة الوظائف",
    "jobs.subtitle": "أنشئ وأدر إعلانات الوظائف الخاصة بك",
    "jobs.postNew": "نشر وظيفة جديدة",
    "jobs.loading": "جاري تحميل الوظائف...",
    "jobs.noJobs": "لا توجد وظائف منشورة بعد",
    "jobs.noJobs.subtitle": "ابدأ بنشر أول وظيفة لك",
    "jobs.postFirst": "انشر وظيفتك الأولى",
    "jobs.edit": "تعديل",
    "jobs.delete": "حذف",
    "jobs.viewDetails": "عرض التفاصيل",
    "jobs.viewCandidates": "عرض المرشحين",
    "jobs.status.open": "مفتوحة",
    "jobs.status.closed": "مغلقة",
    "jobs.status.draft": "مسودة",

    // Candidates
    "candidate.match": "درجة المطابقة",
    "candidate.view": "عرض الملف",
    "candidate.contact": "تواصل",
    "candidate.experience": "الخبرة",
    "candidates.title": "البحث عن المرشحين",
    "candidates.subtitle": "ابحث وأدر مجموعة المرشحين الخاصة بك",
    "candidates.export": "تصدير",
    "candidates.addCandidate": "إضافة مرشح",
    "candidates.searchFilters": "البحث والفلاتر",
    "candidates.searchPlaceholder": "ابحث بالاسم أو المسمى أو البريد الإلكتروني أو المهارات...",
    "candidates.allExperience": "جميع الخبرات",
    "candidates.experience.0-5": "0-5 سنوات",
    "candidates.experience.5-10": "5-10 سنوات",
    "candidates.experience.10+": "10+ سنوات",
    "candidates.allSkills": "جميع المهارات",
    "candidates.activeFilters": "الفلاتر النشطة:",
    "candidates.clearAll": "مسح الكل",
    "candidates.loading": "جاري تحميل المرشحين...",
    "candidates.noCandidates": "لا يوجد مرشحون بعد",
    "candidates.noResults": "لم يتم العثور على مرشحين",
    "candidates.noCandidates.subtitle": "ابدأ ببناء مجموعة المرشحين بإضافة مرشحين",
    "candidates.noResults.subtitle": "حاول تعديل فلاتر البحث",
    "candidates.addFirst": "أضف مرشحك الأول",
    "candidates.found": "مرشحون تم العثور عليهم",
    "candidates.sortedByScore": "مرتبة حسب درجة المطابقة",
    "candidates.addNew": "إضافة مرشح جديد",

    // Auth
    "auth.login": "تسجيل الدخول",
    "auth.loginDescription": "أدخل بريدك الإلكتروني أدناه لتسجيل الدخول إلى حسابك",
    "auth.signUp": "إنشاء حساب",
    "auth.signUpDescription": "إنشاء حساب جديد",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.repeatPassword": "تكرار كلمة المرور",
    "auth.fullName": "الاسم الكامل",
    "auth.fullNamePlaceholder": "أحمد محمد",
    "auth.or": "أو المتابعة باستخدام",
    "auth.googleSignIn": "تسجيل الدخول باستخدام جوجل",
    "auth.googleSignUp": "إنشاء حساب باستخدام جوجل",
    "auth.noAccount": "ليس لديك حساب؟",
    "auth.haveAccount": "هل لديك حساب بالفعل؟",
    "auth.loggingIn": "جاري تسجيل الدخول...",
    "auth.creatingAccount": "جاري إنشاء الحساب...",
    "auth.error": "حدث خطأ",
    "auth.passwordMismatch": "كلمات المرور غير متطابقة",
    "auth.signin": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.signout": "تسجيل الخروج",

    // Interviews
    "interviews.title": "المقابلات",
    "interviews.subtitle": "إدارة وجدولة مقابلات المرشحين",
    "interviews.schedule": "جدولة مقابلة",
    "interviews.upcoming": "المقابلات القادمة",
    "interviews.past": "المقابلات السابقة",
    "interviews.noUpcoming": "لا توجد مقابلات قادمة",
    "interviews.noPast": "لا توجد مقابلات سابقة بعد",

    // Pricing
    "pricing.title": "اختر خطتك",
    "pricing.subtitle": "اختر الخطة المثالية لاحتياجات التوظيف الخاصة بك",
    "pricing.popular": "الأكثر شعبية",
    "pricing.month": "شهر",
    "pricing.getStarted": "ابدأ الآن",
    "pricing.needHelp": "هل تحتاج مساعدة في اختيار خطة؟ تواصل معنا على",
  },
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const direction: Direction = locale === "ar" ? "rtl" : "ltr"

  useEffect(() => {
    // Update document attributes when locale changes
    document.documentElement.lang = locale
    document.documentElement.dir = direction
    document.body.dir = direction
  }, [locale, direction])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("locale", newLocale)
  }

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem("locale") as Locale | null
    if (savedLocale && (savedLocale === "en" || savedLocale === "ar")) {
      setLocaleState(savedLocale)
    }
  }, [])

  const t = (key: string): string => {
    return translations[locale][key as keyof (typeof translations)["en"]] || key
  }

  return <I18nContext.Provider value={{ locale, direction, setLocale, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }
  return context
}
