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

    // Dashboard
    "dashboard.welcome": "Welcome back",
    "dashboard.candidates.title": "Candidate Search",
    "dashboard.candidates.subtitle": "Find the perfect candidates with AI-powered matching",
    "dashboard.search.placeholder": "Describe the candidate you're looking for...",
    "dashboard.search.button": "Search",
    "dashboard.results": "Candidates Found",
    "dashboard.results.sorted": "Sorted by match score",

    // Candidate Card
    "candidate.match": "Match Score",
    "candidate.view": "View Profile",
    "candidate.contact": "Contact",
    "candidate.experience": "Experience",

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

    // Dashboard
    "dashboard.welcome": "مرحباً بعودتك",
    "dashboard.candidates.title": "البحث عن المرشحين",
    "dashboard.candidates.subtitle": "اعثر على المرشحين المثاليين بمطابقة مدعومة بالذكاء الاصطناعي",
    "dashboard.search.placeholder": "صف المرشح الذي تبحث عنه...",
    "dashboard.search.button": "بحث",
    "dashboard.results": "مرشحون تم العثور عليهم",
    "dashboard.results.sorted": "مرتبة حسب درجة المطابقة",

    // Candidate Card
    "candidate.match": "درجة المطابقة",
    "candidate.view": "عرض الملف",
    "candidate.contact": "تواصل",
    "candidate.experience": "الخبرة",

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
