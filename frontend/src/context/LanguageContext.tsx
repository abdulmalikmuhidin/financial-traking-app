import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'am';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultText?: string) => string;
}

const LANGUAGE_STORAGE_KEY = 'fintrack_lang';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Brand & Slogan
    'app.name': 'FinTrack',
    'app.tagline': 'Financial Intelligence',
    'app.subtitle': 'Clarity, discipline, and intelligence for your personal finances.',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.budgets': 'Budgets',
    'nav.analytics': 'Analytics & Reports',
    'nav.categories': 'Categories',
    'nav.settings': 'Settings',
    'nav.addTransaction': 'Add Transaction',
    'nav.addEntry': 'Add Entry',
    'nav.export': 'Export',
    'nav.logout': 'Log out',
    'nav.demoMode': 'Demo Workspace',

    // Dashboard
    'dash.welcome': 'Good day',
    'dash.demoBanner': 'You are viewing realistic pre-seeded financial data for October 2026. Feel free to log transactions, adjust budgets, or register your own profile.',
    'dash.realBanner': 'Here is your real-time financial trajectory and budget status for October 2026.',
    'dash.netBalance': 'Total Net Balance',
    'dash.netLiquidity': 'Cumulative liquidity in',
    'dash.inflows': 'October Inflows',
    'dash.outflows': 'October Outflows',
    'dash.netSavings': 'Net Savings & Rate',
    'dash.vsPrevMonth': 'vs September',
    'dash.savedRate': 'of monthly income saved',
    'dash.dailyRhythm': 'Daily Spending Rhythm (October 2026)',
    'dash.dailySub': 'Track day-by-day expense occurrences and peak spending spikes.',
    'dash.peak': 'Peak',
    'dash.monthTotal': 'Current Month Total',
    'dash.fullAnalytics': 'Full Analytics',
    'dash.budgetTracking': 'Budget Tracking',
    'dash.viewAll': 'View all',
    'dash.threshold': 'Threshold limit: 80%',
    'dash.adjustLimits': 'Adjust limits',
    'dash.recentTransactions': 'Recent Transactions',
    'dash.recentSub': 'Latest financial activity recorded across your accounts.',
    'dash.openLedger': 'Open Ledger',

    // Transactions
    'tx.title': 'Transaction Ledger',
    'tx.searchPlaceholder': 'Search description, merchant, or notes...',
    'tx.importCsv': 'Import CSV',
    'tx.exportCsv': 'Export CSV',
    'tx.newEntry': 'New Entry',
    'tx.allTypes': 'All Types',
    'tx.expenses': 'Expenses',
    'tx.income': 'Income',
    'tx.thisMonth': 'This Month',
    'tx.lastMonth': 'Last Month',
    'tx.allTime': 'All Time',
    'tx.category': 'Category',
    'tx.allCategories': 'All Categories',
    'tx.sortNewest': 'Newest First',
    'tx.sortOldest': 'Oldest First',
    'tx.sortHighest': 'Highest Amount',
    'tx.sortLowest': 'Lowest Amount',
    'tx.totalFiltered': 'Total Filtered Records',
    'tx.filteredIncome': 'Filtered Income',
    'tx.filteredExpenses': 'Filtered Expenses',
    'tx.netFlow': 'Net Flow',
    'tx.colDesc': 'Transaction / Merchant',
    'tx.colCategory': 'Category',
    'tx.colDate': 'Date',
    'tx.colMethod': 'Method',
    'tx.colAmount': 'Amount',
    'tx.colActions': 'Actions',
    'tx.emptyTitle': 'No transactions found',
    'tx.emptyDesc': 'You have not logged any transactions yet or no records match your filter criteria.',
    'tx.recurring': 'Recurring',

    // Budgets
    'bgt.title': 'Monthly Spending Budgets',
    'bgt.subtitle': 'Target limits and actual expenses for October 2026.',
    'bgt.suggested': 'Load Suggested Budgets',
    'bgt.newBudget': 'Set New Budget',
    'bgt.totalAllocated': 'Total Allocated',
    'bgt.totalSpent': 'Total Spent',
    'bgt.remaining': 'Remaining Buffer',
    'bgt.healthStatus': 'Health Status',
    'bgt.onTrack': 'All on track',
    'bgt.nearLimit': 'Near limit',
    'bgt.overLimit': 'Over limit',
    'bgt.spentThisMonth': 'Spent this month',
    'bgt.remainingLabel': 'Remaining',
    'bgt.overLimitLabel': 'Over limit',
    'bgt.monthlyLimit': 'Monthly limit',
    'bgt.emptyTitle': 'No spending budgets configured',
    'bgt.emptyDesc': 'Setting monthly spending targets helps you control expenses and reach your savings goals faster.',

    // Analytics
    'an.title': 'Financial Analytics & Insights',
    'an.subtitle': 'Holistic breakdown of cashflow, spending distribution, and savings trajectory.',
    'an.inflow': 'Total Inflow',
    'an.outflow': 'Total Outflow',
    'an.net': 'Net Savings',
    'an.topCategory': 'Top Expense Pool',
    'an.cashflowComp': 'Cash Flow Comparison (Last 5 Months)',
    'an.byCategory': 'Spending by Category',
    'an.avgDaily': 'Average Daily Spend',
    'an.largestTx': 'Largest Transaction',

    // Categories
    'cat.title': 'Categories & Tax Tags',
    'cat.subtitle': 'Organize financial activities to unlock clear budgeting and automated reports.',
    'cat.newCategory': 'New Category',
    'cat.expenseCategories': 'Expense Categories',
    'cat.incomeCategories': 'Income Categories',
    'cat.default': 'Default',

    // Settings
    'set.title': 'Account Settings & Preferences',
    'set.subtitle': 'Manage your personal profile, language, preferred currency, and database connection.',
    'set.profileInfo': 'Profile Information',
    'set.fullName': 'Full Name',
    'set.email': 'Email Address',
    'set.jobTitle': 'Professional Title',
    'set.incomeTarget': 'Monthly Target Inflow / Baseline',
    'set.language': 'Language Selection',
    'set.languageDesc': 'Choose your preferred interface language.',
    'set.currency': 'Base Currency & Exchange Normalization',
    'set.currencyDesc': 'FinTrack normalizes amounts into your chosen base currency using fixed reference conversion rates.',
    'set.mongoTitle': 'MongoDB Database Connection',
    'set.checkStatus': 'Check Status',
    'set.dataMgmt': 'Data Portability & Management',
    'set.exportJson': 'Export Full Backup (JSON)',
    'set.exportCsv': 'Export Transactions (CSV)',
    'set.restoreJson': 'Restore Backup (JSON)',
    'set.reloadDemo': 'Restore Demo Template',
    'set.clearAll': 'Clear All Financial Records',
    'set.saveChanges': 'Save Changes',

    // Auth
    'auth.signIn': 'Sign In',
    'auth.createAccount': 'Create Account',
    'auth.password': 'Password',
    'auth.preferredCurrency': 'Preferred Currency',
    'auth.submitSignIn': 'Sign In to Workspace',
    'auth.submitRegister': 'Create My Account',
    'auth.demoButton': 'Instant Preview with Demo Account',
    'auth.demoSub': 'Pre-configured with realistic transactions, budgets & analytics.',
    'auth.mongoReady': 'MongoDB Ready',
    'auth.jwtBcrypt': 'JWT & Bcrypt',
    'auth.fullStack': 'Full-Stack',
  },
  am: {
    // Brand & Slogan
    'app.name': 'FinTrack',
    'app.tagline': 'የፋይናንስ ብልህነት',
    'app.subtitle': 'ለግል ፋይናንስዎ ግልጽነት፣ ዲሲፕሊን እና አስተማማኝ ክትትል።',

    // Navigation
    'nav.dashboard': 'ዳሽቦርድ',
    'nav.transactions': 'ግብይቶች',
    'nav.budgets': 'በጀቶች',
    'nav.analytics': 'ትንታኔ እና ሪፖርቶች',
    'nav.categories': 'ምድቦች',
    'nav.settings': 'ቅንብሮች',
    'nav.addTransaction': 'አዲስ ግብይት መዝግብ',
    'nav.addEntry': 'አዲስ መዝግብ',
    'nav.export': 'አውርድ',
    'nav.logout': 'ውጣ',
    'nav.demoMode': 'የሙከራ የስራ ቦታ',

    // Dashboard
    'dash.welcome': 'እንደምን ዋሉ',
    'dash.demoBanner': 'የጥቅምት 2026 ተጨባጭ የሙከራ የፋይናንስ መረጃ እየተመለከቱ ነው። ግብይቶችን መመዝገብ፣ በጀት ማስተካከል ወይም የራስዎን መለያ መፍጠር ይችላሉ።',
    'dash.realBanner': 'የጥቅምት 2026 የቀጥታ የፋይናንስ እንቅስቃሴዎ እና የበጀት ሁኔታዎ እዚህ ይገኛል።',
    'dash.netBalance': 'አጠቃላይ የተጣራ ቀሪ ሂሳብ',
    'dash.netLiquidity': 'አጠቃላይ የተጣራ ሀብት በ',
    'dash.inflows': 'የጥቅምት ወር ገቢ',
    'dash.outflows': 'የጥቅምት ወር ወጪ',
    'dash.netSavings': 'የተጣራ ቁጠባ እና ምጣኔ',
    'dash.vsPrevMonth': 'ከመስከረም ጋር ሲነጻጸር',
    'dash.savedRate': 'ከወርሃዊ ገቢ የተቆጠበው ድርሻ',
    'dash.dailyRhythm': 'የቀን ወጪ እንቅስቃሴ (ጥቅምት 2026)',
    'dash.dailySub': 'የቀን በዕለት የወጪ ክስተቶችን እና ከፍተኛ ወጪ የወጣባቸውን ቀናት ይከታተሉ።',
    'dash.peak': 'ከፍተኛው',
    'dash.monthTotal': 'የዚህ ወር አጠቃላይ ወጪ',
    'dash.fullAnalytics': 'ሙሉ ትንታኔ',
    'dash.budgetTracking': 'የበጀት ክትትል',
    'dash.viewAll': 'ሁሉንም ይመልከቱ',
    'dash.threshold': 'የማስጠንቀቂያ ወሰን: 80%',
    'dash.adjustLimits': 'ገደቦችን አስተካክል',
    'dash.recentTransactions': 'የቅርብ ጊዜ ግብይቶች',
    'dash.recentSub': 'በመለያዎችዎ የተመዘገቡ የቅርብ ጊዜ የፋይናንስ እንቅስቃሴዎች።',
    'dash.openLedger': 'ሙሉ መዝገቡን ክፈት',

    // Transactions
    'tx.title': 'የግብይት መዝገብ',
    'tx.searchPlaceholder': 'መግለጫ፣ ነጋዴ ወይም ማስታወሻ ይፈልጉ...',
    'tx.importCsv': 'CSV አስገባ',
    'tx.exportCsv': 'CSV አውርድ',
    'tx.newEntry': 'አዲስ መዝግብ',
    'tx.allTypes': 'ሁሉም አይነቶች',
    'tx.expenses': 'ወጪዎች',
    'tx.income': 'ገቢ',
    'tx.thisMonth': 'በዚህ ወር',
    'tx.lastMonth': 'ባለፈው ወር',
    'tx.allTime': 'በሙሉ ጊዜ',
    'tx.category': 'ምድብ',
    'tx.allCategories': 'ሁሉም ምድቦች',
    'tx.sortNewest': 'አዲሱ መጀመሪያ',
    'tx.sortOldest': 'የቆየው መጀመሪያ',
    'tx.sortHighest': 'ከፍተኛ መጠን',
    'tx.sortLowest': 'ዝቅተኛ መጠን',
    'tx.totalFiltered': 'የተጣሩ መዝገቦች',
    'tx.filteredIncome': 'የተጣራ ገቢ',
    'tx.filteredExpenses': 'የተጣራ ወጪ',
    'tx.netFlow': 'የተጣራ ፍሰት',
    'tx.colDesc': 'ግብይት / ነጋዴ',
    'tx.colCategory': 'ምድብ',
    'tx.colDate': 'ቀን',
    'tx.colMethod': 'የክፍያ መንገድ',
    'tx.colAmount': 'መጠን',
    'tx.colActions': 'እርምጃዎች',
    'tx.emptyTitle': 'ምንም ግብይት አልተገኘም',
    'tx.emptyDesc': 'እስካሁን ምንም ግብይት አልመዘገቡም ወይም ከተመረጠው ማጣሪያ ጋር የሚስማማ የለም።',
    'tx.recurring': 'ተደጋጋሚ',

    // Budgets
    'bgt.title': 'የወር ወጪ በጀቶች',
    'bgt.subtitle': 'ለጥቅምት 2026 የታለሙ የበጀት ወሰኖች እና ትክክለኛ ወጪዎች።',
    'bgt.suggested': 'የተጠቆሙ በጀቶችን ጫን',
    'bgt.newBudget': 'አዲስ በጀት መድብ',
    'bgt.totalAllocated': 'አጠቃላይ የተመደበ',
    'bgt.totalSpent': 'አጠቃላይ የወጣ',
    'bgt.remaining': 'የቀረ ቀሪ ሂሳብ',
    'bgt.healthStatus': 'የበጀት ጤና ሁኔታ',
    'bgt.onTrack': 'ሁሉም በጥሩ ሁኔታ ላይ',
    'bgt.nearLimit': 'ወደ ገደቡ እየተቃረበ',
    'bgt.overLimit': 'በጀት አልፏል',
    'bgt.spentThisMonth': 'በዚህ ወር የወጣ',
    'bgt.remainingLabel': 'የቀረ',
    'bgt.overLimitLabel': 'ከገደብ በላይ',
    'bgt.monthlyLimit': 'የወር ገደብ',
    'bgt.emptyTitle': 'ምንም የተመደበ በጀት የለም',
    'bgt.emptyDesc': 'የወርሃዊ ወጪ ገደቦችን ማውጣት ወጪን ለመቆጣጠር እና የቁጠባ ግብዎን በፍጥነት ለመምታት ይረዳዎታል።',

    // Analytics
    'an.title': 'የፋይናንስ ትንታኔ እና እይታዎች',
    'an.subtitle': 'የገንዘብ ፍሰት፣ የወጪ ክፍፍል እና የቁጠባ ሂደት አጠቃላይ ዳሰሳ።',
    'an.inflow': 'አጠቃላይ ገቢ',
    'an.outflow': 'አጠቃላይ ወጪ',
    'an.net': 'የተጣራ ቁጠባ',
    'an.topCategory': 'ከፍተኛ የወጪ ምድብ',
    'an.cashflowComp': 'የገንዘብ ፍሰት ንጽጽር (የመጨረሻዎቹ 5 ወራት)',
    'an.byCategory': 'ወጪዎች በምድብ',
    'an.avgDaily': 'አማካይ የቀን ወጪ',
    'an.largestTx': 'ትልቁ ነጠላ ግብይት',

    // Categories
    'cat.title': 'ምድቦች እና መለያዎች',
    'cat.subtitle': 'ትክክለኛ የበጀት ቁጥጥር እና አውቶማቲክ ሪፖርቶችን ለማግኘት የፋይናንስ እንቅስቃሴዎችን ያደራጁ።',
    'cat.newCategory': 'አዲስ ምድብ',
    'cat.expenseCategories': 'የወጪ ምድቦች',
    'cat.incomeCategories': 'የገቢ ምድቦች',
    'cat.default': 'መሰረታዊ',

    // Settings
    'set.title': 'የመለያ ቅንብሮች እና ምርጫዎች',
    'set.subtitle': 'የግል መረጃዎን፣ ቋንቋ፣ ተመራጭ የገንዘብ አይነት እና የዳታቤዝ ግንኙነትን ያስተዳድሩ።',
    'set.profileInfo': 'የመለያ መረጃ',
    'set.fullName': 'ሙሉ ስም',
    'set.email': 'የኢሜይል አድራሻ',
    'set.jobTitle': 'የስራ ድርሻ',
    'set.incomeTarget': 'የታለመ ወርሃዊ ገቢ',
    'set.language': 'የቋንቋ ምርጫ (Language)',
    'set.languageDesc': 'ለመተግበሪያው የሚመርጡትን ቋንቋ ይምረጡ።',
    'set.currency': 'መሰረታዊ የገንዘብ አይነት እና የምንዛሬ ተመን',
    'set.currencyDesc': 'FinTrack አስተማማኝ የምንዛሬ ተመን በመጠቀም ሁሉንም መጠኖች ወደ መረጡት የገንዘብ አይነት ያስተካክላል።',
    'set.mongoTitle': 'የሞንጎዲቢ (MongoDB) ዳታቤዝ ግንኙነት',
    'set.checkStatus': 'ሁኔታውን ፈትሽ',
    'set.dataMgmt': 'የመረጃ አያያዝ እና ቅጂ (Backup)',
    'set.exportJson': 'ሙሉ ቅጂ አውርድ (JSON)',
    'set.exportCsv': 'ግብይቶችን አውርድ (CSV)',
    'set.restoreJson': 'ቅጂ መልስ (JSON)',
    'set.reloadDemo': 'የሙከራ መረጃ እንደገና ጫን',
    'set.clearAll': 'ሁሉንም መረጃዎች አጥፋ',
    'set.saveChanges': 'ለውጦችን መዝግብ',

    // Auth
    'auth.signIn': 'ይግቡ',
    'auth.createAccount': 'መለያ ፍጠር',
    'auth.password': 'የይለፍ ቃል',
    'auth.preferredCurrency': 'ተመራጭ የገንዘብ አይነት',
    'auth.submitSignIn': 'ወደ መተግበሪያው ይግቡ',
    'auth.submitRegister': 'መለያዬን ፍጠር',
    'auth.demoButton': 'በሙከራ መለያ ወዲያውኑ ይሞክሩ',
    'auth.demoSub': 'የተዘጋጁ ተጨባጭ ግብይቶች፣ በጀቶች እና ትንታኔዎች ያሉት።',
    'auth.mongoReady': 'ሞንጎዲቢ (MongoDB) ዝግጁ',
    'auth.jwtBcrypt': 'JWT እና Bcrypt ጥበቃ',
    'auth.fullStack': 'ሙሉ-ስታክ (Full-Stack)',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'am' || saved === 'en') return saved;
    } catch {}
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {}
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    if (TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
