import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings } from '../utils/api';
import { changeLanguage } from '../i18n';

const AppearanceContext = createContext();

export const AppearanceProvider = ({ children }) => {
    const [appearance, setAppearance] = useState({
        theme: 'light',
        sidebarStyle: 'modern',
        primaryColor: '#10B981',
        fontSize: 'medium',
        fontFamily: 'Inter'
    });

    const [general, setGeneral] = useState({
        companyName: 'CRM Pro',
        timezone: 'UTC+05:30',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        region: 'India',
        language: 'en-IN',
        timeFormat: '24h',
        numberFormat: 'Indian'
    });

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            console.log('Fetching system settings...');
            const data = await getSettings('system');
            console.log('DB Settings Received:', data);

            // 1. Defaults (Base State)
            let finalAppearance = {
                theme: 'light',
                sidebarStyle: 'modern',
                primaryColor: '#10B981',
                fontSize: 'medium',
                fontFamily: 'Inter'
            };

            let finalGeneral = {
                companyName: 'CRM Pro',
                timezone: 'UTC+05:30',
                dateFormat: 'DD/MM/YYYY',
                currency: 'INR',
                region: 'India',
                language: 'en-IN',
                timeFormat: '24h',
                numberFormat: 'Indian'
            };

            // 2. Apply LocalStorage (Cache / User Preference)
            const localSettings = {
                theme: localStorage.getItem('theme'),
                sidebarStyle: localStorage.getItem('sidebarStyle'),
                primaryColor: localStorage.getItem('primaryColor'),
                fontSize: localStorage.getItem('fontSize'),
                fontFamily: localStorage.getItem('fontFamily')
            };

            Object.entries(localSettings).forEach(([key, value]) => {
                if (value !== null && value !== 'undefined') {
                    finalAppearance[key] = value;
                }
            });

            // 3. Apply DB Settings (Overrides LocalStorage if present)
            if (data) {
                if (data.appearance && Object.keys(data.appearance).length > 0) {
                    console.log('Applying DB appearance overrides:', data.appearance);
                    finalAppearance = { ...finalAppearance, ...data.appearance };
                }

                if (data.general && Object.keys(data.general).length > 0) {
                    console.log('Applying DB general overrides:', data.general);
                    finalGeneral = { ...finalGeneral, ...data.general };
                }
            }

            // 4. Update State
            setGeneral(finalGeneral);
            updateAppearance(finalAppearance);

            // Side effect: Update Language attribute and i18n
            if (finalGeneral.language) {
                document.documentElement.lang = finalGeneral.language.split('-')[0];
                changeLanguage(finalGeneral.language);
            }

        } catch (err) {
            console.error('Failed to load appearance settings:', err);
            // Fallback to local storage if API completely fails
            const localSettings = {
                theme: localStorage.getItem('theme'),
                sidebarStyle: localStorage.getItem('sidebarStyle'),
                primaryColor: localStorage.getItem('primaryColor'),
                fontSize: localStorage.getItem('fontSize'),
                fontFamily: localStorage.getItem('fontFamily')
            };
            updateAppearance(prev => {
                let fallback = { ...prev };
                Object.entries(localSettings).forEach(([key, value]) => {
                    if (value) fallback[key] = value;
                });
                return fallback;
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Add updateGeneral function to expose to consumers
    const updateGeneral = (newGeneral) => {
        setGeneral(prev => {
            const updated = { ...prev, ...newGeneral };
            // Update lang attribute and trigger i18n language change
            if (updated.language) {
                const langCode = updated.language.split('-')[0];
                document.documentElement.lang = langCode;

                // Use native i18n system to change language
                changeLanguage(updated.language);
            }
            return updated;
        });
    };

    const updateAppearance = (newSettings) => {
        setAppearance(prev => {
            const updated = { ...prev, ...newSettings };

            // Apply theme attribute
            document.documentElement.setAttribute('data-theme', updated.theme);

            // Apply Tailwind dark mode class
            if (updated.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }

            // Apply sidebar style attribute
            document.documentElement.setAttribute('data-sidebar-style', updated.sidebarStyle);

            // Apply CSS variables
            document.documentElement.style.setProperty('--primary', updated.primaryColor);
            document.documentElement.style.setProperty('--font-family', updated.fontFamily + ', sans-serif');

            // Calculate and set primary-light (10% opacity)
            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            };

            const rgb = hexToRgb(updated.primaryColor);
            if (rgb) {
                document.documentElement.style.setProperty('--primary-light', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
                document.documentElement.style.setProperty('--primary-shadow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);

                // Simple darken logic for primary-dark
                const darken = (c) => Math.floor(c * 0.8);
                const darkHex = '#' + ((1 << 24) + (darken(rgb.r) << 16) + (darken(rgb.g) << 8) + darken(rgb.b)).toString(16).slice(1);
                document.documentElement.style.setProperty('--primary-dark', darkHex);
            }

            // Handle font loading if not standard
            const nonStandardFonts = ['Outfit', 'Poppins', 'Montserrat', 'Open Sans', 'Work Sans', 'DM Sans', 'Plus Jakarta Sans', 'Manrope'];
            if (nonStandardFonts.includes(updated.fontFamily)) {
                if (!document.getElementById(`font-${updated.fontFamily}`)) {
                    const link = document.createElement('link');
                    link.id = `font-${updated.fontFamily}`;
                    link.rel = 'stylesheet';
                    link.href = `https://fonts.googleapis.com/css2?family=${updated.fontFamily.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
                    document.head.appendChild(link);
                }
            }

            // Persist to localStorage
            localStorage.setItem('theme', updated.theme);
            localStorage.setItem('sidebarStyle', updated.sidebarStyle);
            localStorage.setItem('primaryColor', updated.primaryColor);
            localStorage.setItem('fontSize', updated.fontSize);
            localStorage.setItem('fontFamily', updated.fontFamily);

            return updated;
        });
    };

    const toggleTheme = () => {
        const newTheme = appearance.theme === 'light' ? 'dark' : 'light';
        updateAppearance({ theme: newTheme });
    };

    return (
        <AppearanceContext.Provider value={{ appearance, general, updateAppearance, updateGeneral, toggleTheme }}>
            {children}
        </AppearanceContext.Provider>
    );
};

export const useAppearance = () => useContext(AppearanceContext);
