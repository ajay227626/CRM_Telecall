// Comprehensive regional and internationalization options for SystemSettings

export const TIMEZONES = [
    { value: 'UTC-12:00', label: 'Baker Island Time (UTC-12:00)' },
    { value: 'UTC-11:00', label: 'Samoa Standard Time (UTC-11:00)' },
    { value: 'UTC-10:00', label: 'HST - Hawaii (UTC-10:00)' },
    { value: 'UTC-09:00', label: 'AKST - Alaska (UTC-09:00)' },
    { value: 'UTC-08:00', label: 'PST - Pacific Time (UTC-08:00)' },
    { value: 'UTC-07:00', label: 'MST - Mountain Time (UTC-07:00)' },
    { value: 'UTC-06:00', label: 'CST - Central Time (UTC-06:00)' },
    { value: 'UTC-05:00', label: 'EST - Eastern Time (UTC-05:00)' },
    { value: 'UTC-04:00', label: 'AST - Atlantic Time (UTC-04:00)' },
    { value: 'UTC-03:00', label: 'BRT - Brazil Time (UTC-03:00)' },
    { value: 'UTC-02:00', label: 'South Georgia Time (UTC-02:00)' },
    { value: 'UTC-01:00', label: 'Azores Time (UTC-01:00)' },
    { value: 'UTC+00:00', label: 'GMT - Greenwich Mean Time (UTC+00:00)' },
    { value: 'UTC+01:00', label: 'CET - Central European Time (UTC+01:00)' },
    { value: 'UTC+02:00', label: 'EET - Eastern European Time (UTC+02:00)' },
    { value: 'UTC+03:00', label: 'MSK - Moscow Time (UTC+03:00)' },
    { value: 'UTC+04:00', label: 'GST - Gulf Standard Time (UTC+04:00)' },
    { value: 'UTC+05:00', label: 'PKT - Pakistan Time (UTC+05:00)' },
    { value: 'UTC+05:30', label: 'IST - India Standard Time (UTC+05:30)' },
    { value: 'UTC+06:00', label: 'BST - Bangladesh Time (UTC+06:00)' },
    { value: 'UTC+07:00', label: 'ICT - Indochina Time (UTC+07:00)' },
    { value: 'UTC+08:00', label: 'CST - China/Singapore Time (UTC+08:00)' },
    { value: 'UTC+09:00', label: 'JST - Japan Time (UTC+09:00)' },
    { value: 'UTC+10:00', label: 'AEST - Australian Eastern Time (UTC+10:00)' },
    { value: 'UTC+11:00', label: 'AEDT - Sydney Summer Time (UTC+11:00)' },
    { value: 'UTC+12:00', label: 'NZST - New Zealand Time (UTC+12:00)' },
    { value: 'UTC+13:00', label: 'Phoenix Islands Time (UTC+13:00)' },
    { value: 'UTC+14:00', label: 'Line Islands Time (UTC+14:00)' }
];

export const REGIONS = [
    { value: 'India', label: 'India', flag: '🇮🇳' },
    { value: 'United States', label: 'United States', flag: '🇺🇸' },
    { value: 'United Kingdom', label: 'United Kingdom', flag: '🇬🇧' },
    { value: 'Canada', label: 'Canada', flag: '🇨🇦' },
    { value: 'Australia', label: 'Australia', flag: '🇦🇺' },
    { value: 'Singapore', label: 'Singapore', flag: '🇸🇬' },
    { value: 'United Arab Emirates', label: 'United Arab Emirates', flag: '🇦🇪' },
    { value: 'Saudi Arabia', label: 'Saudi Arabia', flag: '🇸🇦' },
    { value: 'Germany', label: 'Germany', flag: '🇩🇪' },
    { value: 'France', label: 'France', flag: '🇫🇷' },
    { value: 'Spain', label: 'Spain', flag: '🇪🇸' },
    { value: 'Italy', label: 'Italy', flag: '🇮🇹' },
    { value: 'Netherlands', label: 'Netherlands', flag: '🇳🇱' },
    { value: 'Sweden', label: 'Sweden', flag: '🇸🇪' },
    { value: 'Japan', label: 'Japan', flag: '🇯🇵' },
    { value: 'China', label: 'China', flag: '🇨🇳' },
    { value: 'South Korea', label: 'South Korea', flag: '🇰🇷' },
    { value: 'Brazil', label: 'Brazil', flag: '🇧🇷' },
    { value: 'Mexico', label: 'Mexico', flag: '🇲🇽' },
    { value: 'South Africa', label: 'South Africa', flag: '🇿🇦' }
];

export const LANGUAGES = [
    { value: 'en-US', label: 'English (United States)' },
    { value: 'en-GB', label: 'English (United Kingdom)' },
    { value: 'en-IN', label: 'English (India)' },
    { value: 'en-AU', label: 'English (Australia)' },
    { value: 'hi-IN', label: 'हिन्दी (Hindi)' },
    { value: 'bn-IN', label: 'বাংলা (Bengali)' },
    { value: 'ta-IN', label: 'தமிழ் (Tamil)' },
    { value: 'te-IN', label: 'తెలుగు (Telugu)' },
    { value: 'mr-IN', label: 'मराठी (Marathi)' },
    { value: 'es-ES', label: 'Español (Spanish)' },
    { value: 'fr-FR', label: 'Français (French)' },
    { value: 'de-DE', label: 'Deutsch (German)' },
    { value: 'it-IT', label: 'Italiano (Italian)' },
    { value: 'pt-BR', label: 'Português (Portuguese)' },
    { value: 'zh-CN', label: '中文 (Chinese Simplified)' },
    { value: 'ja-JP', label: '日本語 (Japanese)' },
    { value: 'ko-KR', label: '한국어 (Korean)' },
    { value: 'ar-SA', label: 'العربية (Arabic)' }
];

export const DATE_FORMATS = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)', example: '31/12/2024' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)', example: '12/31/2024' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)', example: '2024-12-31' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (31-12-2024)', example: '31-12-2024' },
    { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY (12-31-2024)', example: '12-31-2024' },
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2024)', example: '31.12.2024' },
    { value: 'YYYY/MM/DD', label: 'YYYY/MM/DD (2024/12/31)', example: '2024/12/31' },
    { value: 'MMMM DD, YYYY', label: 'Month DD, YYYY (December 31, 2024)', example: 'December 31, 2024' }
];

export const CURRENCIES = [
    { value: 'INR', label: 'INR - Indian Rupee (₹)', symbol: '₹' },
    { value: 'USD', label: 'USD - US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR - Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'GBP - British Pound (£)', symbol: '£' },
    { value: 'CAD', label: 'CAD - Canadian Dollar (C$)', symbol: 'C$' },
    { value: 'AUD', label: 'AUD - Australian Dollar (A$)', symbol: 'A$' },
    { value: 'SGD', label: 'SGD - Singapore Dollar (S$)', symbol: 'S$' },
    { value: 'AED', label: 'AED - UAE Dirham (AED)', symbol: 'AED' },
    { value: 'SAR', label: 'SAR - Saudi Riyal (SAR)', symbol: 'SAR' },
    { value: 'JPY', label: 'JPY - Japanese Yen (¥)', symbol: '¥' },
    { value: 'CNY', label: 'CNY - Chinese Yuan (¥)', symbol: '¥' },
    { value: 'KRW', label: 'KRW - South Korean Won (₩)', symbol: '₩' },
    { value: 'BRL', label: 'BRL - Brazilian Real (R$)', symbol: 'R$' },
    { value: 'MXN', label: 'MXN - Mexican Peso (MX$)', symbol: 'MX$' },
    { value: 'ZAR', label: 'ZAR - South African Rand (R)', symbol: 'R' },
    { value: 'CHF', label: 'CHF - Swiss Franc (CHF)', symbol: 'CHF' },
    { value: 'SEK', label: 'SEK - Swedish Krona (kr)', symbol: 'kr' },
    { value: 'NOK', label: 'NOK - Norwegian Krone (kr)', symbol: 'kr' },
    { value: 'DKK', label: 'DKK - Danish Krone (kr)', symbol: 'kr' },
    { value: 'PLN', label: 'PLN - Polish Złoty (zł)', symbol: 'zł' }
];

export const FONT_FAMILIES = [
    { value: 'Inter', label: 'Inter (Clean & Professional)', style: 'sans-serif' },
    { value: 'Roboto', label: 'Roboto (Technical & Modern)', style: 'sans-serif' },
    { value: 'Poppins', label: 'Poppins (Geometric & Friendly)', style: 'sans-serif' },
    { value: 'Outfit', label: 'Outfit (Round & Friendly)', style: 'sans-serif' },
    { value: 'Montserrat', label: 'Montserrat (Urban & Bold)', style: 'sans-serif' },
    { value: 'Open Sans', label: 'Open Sans (Humanist & Readable)', style: 'sans-serif' },
    { value: 'Work Sans', label: 'Work Sans (Versatile & Clean)', style: 'sans-serif' },
    { value: 'DM Sans', label: 'DM Sans (Elegant & Minimal)', style: 'sans-serif' },
    { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Modern & Geometric)', style: 'sans-serif' },
    { value: 'Manrope', label: 'Manrope (Contemporary & Balanced)', style: 'sans-serif' }
];

// ========== LEAD MANAGEMENT OPTIONS ==========

export const TIME_FORMATS = [
  { value: '12h', label: '12-hour (3:30 PM)' },
  { value: '24h', label: '24-hour (15:30)' },
];

export const NUMBER_FORMATS = [
  { value: 'International', label: 'International (1,000,000.00)' },
  { value: 'Indian', label: 'Indian (10,00,000.00)' },
  { value: 'European', label: 'European (1.000.000,00)' },
];

export const THEMES = [
  { value: 'light', label: 'Solar Light', icon: '☀️' },
  { value: 'dark', label: 'Deep Dark', icon: '🌙' },
];

export const SIDEBAR_STYLES = [
  { value: 'modern', label: 'Modern', description: 'Clean and minimal design' },
  { value: 'compact', label: 'Compact', description: 'Space-saving layout' },
  { value: 'classic', label: 'Classic', description: 'Traditional style' },
];

export const FONT_SIZES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

export const LEAD_SOURCES = [
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'referral', label: 'Referral', icon: '👥' },
  { value: 'cold-call', label: 'Cold Call', icon: '📞' },
  { value: 'email-campaign', label: 'Email Campaign', icon: '✉️' },
  { value: 'social-media', label: 'Social Media', icon: '📱' },
  { value: 'trade-show', label: 'Trade Show', icon: '🎪' },
  { value: 'partner', label: 'Partner', icon: '🤝' },
  { value: 'direct', label: 'Direct', icon: '🎯' },
  { value: 'advertisement', label: 'Advertisement', icon: '📺' },
  { value: 'other', label: 'Other', icon: '📋' },
];

export const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: '#6B7280', icon: '⬇️' },
  { value: 'medium', label: 'Medium', color: '#F59E0B', icon: '➡️' },
  { value: 'high', label: 'High', color: '#EF4444', icon: '⬆️' },
  { value: 'urgent', label: 'Urgent', color: '#DC2626', icon: '🔥' },
];

export const INDUSTRIES = [
  { value: 'technology', label: 'Technology', icon: '💻' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'real-estate', label: 'Real Estate', icon: '🏢' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
  { value: 'retail', label: 'Retail', icon: '🛒' },
  { value: 'consulting', label: 'Consulting', icon: '📊' },
  { value: 'hospitality', label: 'Hospitality', icon: '🏨' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'construction', label: 'Construction', icon: '🏗️' },
  { value: 'telecommunications', label: 'Telecommunications', icon: '📡' },
  { value: 'other', label: 'Other', icon: '📁' },
];

export const LEAD_STAGES = [
  { value: 'new', label: 'New', color: '#3B82F6', description: 'Just received' },
  { value: 'contacted', label: 'Contacted', color: '#8B5CF6', description: 'First contact made' },
  { value: 'qualified', label: 'Qualified', color: '#F59E0B', description: 'Qualified as potential customer' },
  { value: 'proposal-sent', label: 'Proposal Sent', color: '#10B981', description: 'Proposal submitted' },
  { value: 'negotiation', label: 'Negotiation', color: '#F97316', description: 'In negotiation' },
  { value: 'closed-won', label: 'Closed Won', color: '#059669', description: 'Successfully closed' },
  { value: 'closed-lost', label: 'Closed Lost', color: '#EF4444', description: 'Lost opportunity' },
  { value: 'on-hold', label: 'On Hold', color: '#6B7280', description: 'Temporarily paused' },
];

export const CONTACT_METHODS = [
  { value: 'email', label: 'Email', icon: '✉️', color: '#3B82F6' },
  { value: 'phone', label: 'Phone', icon: '📞', color: '#10B981' },
  { value: 'sms', label: 'SMS', icon: '💬', color: '#8B5CF6' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '📱', color: '#25D366' },
  { value: 'video-call', label: 'Video Call', icon: '🎥', color: '#F59E0B' },
  { value: 'in-person', label: 'In-Person', icon: '🤝', color: '#EC4899' },
];

export const LEAD_TAGS = [
  { value: 'hot-lead', label: 'Hot Lead', color: '#EF4444' },
  { value: 'follow-up-required', label: 'Follow-up Required', color: '#F59E0B' },
  { value: 'decision-maker', label: 'Decision Maker', color: '#8B5CF6' },
  { value: 'budget-approved', label: 'Budget Approved', color: '#10B981' },
  { value: 'technical-evaluation', label: 'Technical Evaluation', color: '#3B82F6' },
  { value: 'contract-review', label: 'Contract Review', color: '#F97316' },
  { value: 'vip', label: 'VIP', color: '#EC4899' },
  { value: 'high-value', label: 'High Value', color: '#059669' },
  { value: 'needs-nurturing', label: 'Needs Nurturing', color: '#6B7280' },
  { value: 'competitor-consideration', label: 'Competitor Consideration', color: '#DC2626' },
];
