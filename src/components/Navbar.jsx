import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { useEcosystemApps } from '../hooks/useEcosystemApps';
import { getApiBaseUrl } from '../utils/apiUrl';

const Navbar = ({ user: initialUser, onLogout }) => {
  const { t } = useTranslation();
  const [user, setUser] = useState(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);
  const { apps: ecosystemApps, loading: appsLoading } = useEcosystemApps();

  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
      return;
    }

    const fetchUser = async () => {
      try {
        const apiUrl = getApiBaseUrl();
        const res = await fetch(`${apiUrl}/api/auth/me`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Navbar fetch user error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [initialUser]);

  // Click outside listener for the 9-dots App Switcher dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (switcherRef.current && !switcherRef.current.contains(event.target)) {
        setIsSwitcherOpen(false);
      }
    };
    if (isSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSwitcherOpen]);

  const activeOrgId = user?.organisationId || 'org_personal_workspace';
  const isPersonal = user?.organisationType === 'Personal' || activeOrgId.startsWith('org_personal_');
  const orgType = isPersonal ? 'Personal' : 'Business';
  const orgName = user?.organisationName || (isPersonal ? `${user?.name || 'Personal'}'s Workspace` : activeOrgId);

  const entitlements = user?.entitlements || [];
  const hasEntitlement = entitlements.some(e => 
    ['telecall-crm', 'crm-telecall', 'all-access', 'all-apps', 'enterprise-suite'].includes(e.toLowerCase())
  ) || (user?.systemRole || user?.role || '').toLowerCase() === 'superadmin';

  return (
    <header className="navbar top-app-navbar" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1.75rem',
      backgroundColor: 'var(--bg-card, #ffffff)',
      borderBottom: '1px solid var(--border, #e5e7eb)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Left Area: 9-Dots App Switcher + Workspace Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        
        {/* 9-Dots Ecosystem App Switcher */}
        <div style={{ position: 'relative' }} ref={switcherRef}>
          <button
            type="button"
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            title="Switch Ecosystem Apps (Central SLM)"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: '1px solid var(--border, #e5e7eb)',
              backgroundColor: isSwitcherOpen ? 'var(--bg-hover, #f3f4f6)' : 'transparent',
              color: isSwitcherOpen ? '#4f46e5' : 'var(--text-secondary, #4b5563)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="ri-grid-fill" style={{ fontSize: '1.25rem' }}></i>
          </button>

          {/* App Switcher Dropdown Menu */}
          {isSwitcherOpen && (
            <div style={{
              position: 'absolute',
              top: '48px',
              left: 0,
              width: '330px',
              borderRadius: '14px',
              backgroundColor: 'var(--bg-card, #ffffff)',
              border: '1px solid var(--border, #e5e7eb)',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.16)',
              padding: '14px',
              zIndex: 100,
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '10px',
                borderBottom: '1px solid var(--border, #e5e7eb)',
                marginBottom: '10px'
              }}>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted, #6b7280)'
                }}>
                  Central SLM Ecosystem
                </span>
                <span style={{
                  fontSize: '0.68rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  fontWeight: 600
                }}>
                  Unified Apps
                </span>
              </div>

              {/* App Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {appsLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '0.82rem' }}>
                    <i className="ri-loader-4-line spin" style={{ display: 'inline-block', marginRight: '6px' }} />
                    Loading apps from App Hub...
                  </div>
                ) : ecosystemApps && ecosystemApps.length > 0 ? (
                  ecosystemApps.map((app) => (
                    <a
                      key={app.key || app.name}
                      href={app.launchUrl || app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsSwitcherOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        color: 'inherit',
                        transition: 'background-color 0.15s ease',
                        backgroundColor: 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f3f4f6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: app.gradient,
                        color: '#ffffff',
                        flexShrink: 0,
                        fontSize: '1.1rem'
                      }}>
                        <i className={app.icon}></i>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          color: 'var(--text-main, #111827)'
                        }}>
                          {app.name}
                        </span>
                        <span style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted, #6b7280)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {app.description}
                        </span>
                      </div>
                      <i className="ri-arrow-right-up-line" style={{
                        marginLeft: 'auto',
                        fontSize: '0.9rem',
                        color: 'var(--text-muted, #9ca3af)'
                      }}></i>
                    </a>
                  ))
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted, #9ca3af)', fontSize: '0.82rem' }}>
                    <i className="ri-apps-2-line" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}></i>
                    No apps found in your ecosystem.
                  </div>
                )}
              </div>

              <div style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '1px solid var(--border, #e5e7eb)',
                textAlign: 'center'
              }}>
                <a
                  href="https://apps.ajaywebservices.in/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '0.78rem',
                    color: '#4f46e5',
                    textDecoration: 'none',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span>Explore all ecosystem tools</span>
                  <i className="ri-arrow-right-line"></i>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Organisation Context Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: isPersonal 
            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
            : 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)',
          color: '#ffffff',
          boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
          fontSize: '1.15rem'
        }}>
          <i className={isPersonal ? 'ri-user-smile-line' : 'ri-building-4-line'}></i>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: 'var(--text-main, #111827)',
              letterSpacing: '-0.01em',
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {loading ? 'Loading workspace...' : orgName}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              backgroundColor: isPersonal ? 'rgba(99, 102, 241, 0.1)' : 'rgba(16, 185, 129, 0.12)',
              color: isPersonal ? '#4f46e5' : '#059669',
              border: `1px solid ${isPersonal ? 'rgba(99, 102, 241, 0.25)' : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isPersonal ? '#6366f1' : '#10b981'
              }}></span>
              {orgType}
            </span>
          </div>

          <span style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted, #6b7280)',
            fontFamily: 'monospace'
          }}>
            {activeOrgId}
          </span>
        </div>
      </div>

      {/* Right Area: Entitlement Badge + Unified Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Entitlement Badge */}
        {hasEntitlement ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.78rem',
            fontWeight: 500,
            color: '#059669'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981'
            }}></span>
            <span className="hidden sm:inline">SLM Entitled:</span>
            <span>Telecall CRM</span>
          </div>
        ) : (
          <a
            href="https://apps.ajaywebservices.in/billing/checkout?product=telecall-crm"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '8px',
              backgroundColor: '#fee2e2',
              border: '1px solid #f87171',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#b91c1c',
              textDecoration: 'none'
            }}
          >
            <i className="ri-error-warning-line"></i>
            <span>Upgrade Subscription</span>
          </a>
        )}

        {/* Unified Single Logout Button */}
        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sign out of Central SLM Session"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: 'var(--text-secondary, #4b5563)',
              backgroundColor: 'var(--bg-main, #f3f4f6)',
              border: '1px solid var(--border, #e5e7eb)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#dc2626';
              e.currentTarget.style.borderColor = '#fca5a5';
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-secondary, #4b5563)';
              e.currentTarget.style.borderColor = 'var(--border, #e5e7eb)';
              e.currentTarget.style.backgroundColor = 'var(--bg-main, #f3f4f6)';
            }}
          >
            <i className="ri-logout-box-r-line"></i>
            <span className="hidden sm:inline">Logout</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
