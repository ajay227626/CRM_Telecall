import { useState, useEffect } from 'react';

const ICON_MAP = {
  'workflow-management-system': { icon: 'ri-flow-chart', color: '#6366f1', gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
  'workflow-fms': { icon: 'ri-flow-chart', color: '#6366f1', gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' },
  'dynamic-portfolio-toolkit': { icon: 'ri-window-line', color: '#10b981', gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' },
  'portfolio-saas': { icon: 'ri-window-line', color: '#10b981', gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' },
  'atlas-crm': { icon: 'ri-dashboard-3-line', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)' },
  'app-hub': { icon: 'ri-apps-fill', color: '#0ea5e9', gradient: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)' }
};

const DEFAULT_VISUAL = {
  icon: 'ri-apps-2-line',
  color: '#3b82f6',
  gradient: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)'
};

const STATIC_FALLBACK = [
  {
    key: 'workflow-management-system',
    name: 'Workflow Management System',
    description: 'Process & Task Automation Hub',
    launchUrl: 'https://workflow.ajaywebservices.in',
    icon: 'ri-flow-chart',
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    badge: 'Enterprise'
  },
  {
    key: 'dynamic-portfolio-toolkit',
    name: 'Dynamic Portfolio Toolkit',
    description: 'Developer & Creator Showcase Platform',
    launchUrl: 'https://portfolio.ajaywebservices.in',
    icon: 'ri-window-line',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    badge: 'Free'
  },
  {
    key: 'app-hub',
    name: 'Central App Hub & SSO',
    description: 'Single Sign-On & Ecosystem App Launcher',
    launchUrl: 'https://apps.ajaywebservices.in/apps',
    icon: 'ri-apps-fill',
    color: '#0ea5e9',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
    badge: 'Hub'
  }
];

export function useEcosystemApps() {
  const [apps, setApps] = useState(STATIC_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        // Try backend proxy first, then direct App Hub API
        let res = null;
        try {
          res = await fetch(`${apiUrl}/api/ecosystem/apps`, { credentials: 'include' });
        } catch (_) {}

        if (!res || !res.ok) {
          res = await fetch('https://apps.ajaywebservices.in/api/ecosystem/apps');
        }

        if (res && res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.applications)) {
            const mapped = data.applications.map((item) => {
              const visual = ICON_MAP[item.key] || ICON_MAP[item.productKey] || DEFAULT_VISUAL;
              return {
                key: item.key || item.productKey,
                name: item.name,
                description: item.description || item.tagline || 'Ecosystem Application',
                launchUrl: item.ecosystem?.launchUrl || item.ecosystem?.homeUrl || `https://${item.key}.ajaywebservices.in`,
                category: item.ecosystem?.category || 'Platform App',
                badge: item.access?.plan || (item.ecosystem?.category?.includes('Developer') ? 'Free' : 'Enterprise'),
                icon: visual.icon,
                color: visual.color,
                gradient: visual.gradient
              };
            });

            if (isMounted && mapped.length > 0) {
              setApps(mapped);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load live App Hub catalog, using fallback:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  return { apps, loading };
}
