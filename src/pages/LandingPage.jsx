import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Phone,
  PhoneCall,
  Users,
  CheckCircle2,
  Shield,
  Zap,
  Lock,
  BarChart3,
  ArrowRight,
  Sparkles,
  Layers,
  Globe,
  Headphones,
  Sliders,
  ChevronRight,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useEcosystemApps } from '../hooks/useEcosystemApps';
import { getApiBaseUrl } from '../utils/apiUrl';

export default function LandingPage({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [activeDialerStatus, setActiveDialerStatus] = useState('Connected');
  const [activeLeadIndex, setActiveLeadIndex] = useState(0);
  const switcherRef = useRef(null);
  const { apps: ecosystemApps, loading: appsLoading } = useEcosystemApps();

  const mockQueue = [
    { name: 'Sarah Jenkins', company: 'Apex Logistics', phone: '+1 (555) 234-8901', status: 'In Call', time: '02:45', category: 'High Intent' },
    { name: 'Michael Chang', company: 'Nexus Capital', phone: '+1 (555) 890-1234', status: 'Queued', time: '--:--', category: 'Enterprise' },
    { name: 'Priya Sharma', company: 'Global EdTech', phone: '+1 (555) 671-9023', status: 'Queued', time: '--:--', category: 'Growth' }
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setIsSwitcherOpen(false);
      }
    };
    if (isSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSwitcherOpen]);

  // Simulate queue movement every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLeadIndex((prev) => (prev + 1) % mockQueue.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [mockQueue.length]);

  const handleStartAuth = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      const apiUrl = getApiBaseUrl();
      window.location.href = `${apiUrl}/api/auth/oidc/login?returnUrl=%2Fdashboard`;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#090d16',
      color: '#f1f5f9',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Background Glow Accents */}
      <div style={{
        position: 'absolute',
        top: '-150px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '900px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(99, 102, 241, 0.12) 40%, transparent 70%)',
        filter: 'blur(70px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        top: '600px',
        right: '-100px',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
        filter: 'blur(90px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* Floating Glassmorphic Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(9, 13, 22, 0.82)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)'
            }}>
              <PhoneCall size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                Telecall<span style={{ color: '#3b82f6' }}>CRM</span>
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.68rem',
                color: '#94a3b8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                By Central SLM
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'none', gap: '2rem', alignItems: 'center' }} className="md-flex">
            <a href="#features" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500, transition: 'color 0.2s' }}>Features</a>
            <a href="#dialer" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500, transition: 'color 0.2s' }}>Live Preview</a>
            <a href="#pricing" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500, transition: 'color 0.2s' }}>Pricing</a>
            <a href="#ecosystem" style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.92rem', fontWeight: 500, transition: 'color 0.2s' }}>Ecosystem</a>
          </nav>

          {/* Actions: 9-Dots Switcher + Primary Auth CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* 9-Dots App Switcher */}
            <div style={{ position: 'relative' }} ref={switcherRef}>
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                title="Switch Central SLM Ecosystem Apps"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: isSwitcherOpen ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSwitcherOpen ? '#38bdf8' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <i className="ri-grid-fill" style={{ fontSize: '1.25rem' }}></i>
              </button>

              {/* Ecosystem Dropdown */}
              {isSwitcherOpen && (
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  right: 0,
                  width: '320px',
                  borderRadius: '14px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                  padding: '14px',
                  zIndex: 100,
                  backdropFilter: 'blur(16px)'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '10px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '10px'
                  }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                      Central SLM Ecosystem
                    </span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 600 }}>
                      SSO Connected
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {appsLoading ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                        <i className="ri-loader-4-line spin" style={{ display: 'inline-block', marginRight: '6px' }} />
                        Loading apps from App Hub...
                      </div>
                    ) : (
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
                            padding: '10px',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: '#e2e8f0',
                            backgroundColor: 'transparent',
                            transition: 'background-color 0.15s'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            backgroundColor: `${app.color || '#3b82f6'}22`,
                            color: app.color || '#3b82f6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.1rem'
                          }}>
                            <i className={app.icon || 'ri-apps-2-line'}></i>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{app.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {app.description || app.tagline}
                            </div>
                          </div>
                          <ExternalLink size={14} color="#64748b" />
                        </a>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
              >
                <span>Enter Workspace</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleStartAuth}
                style={{
                  padding: '8px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
                }}
              >
                <span>Sign In with SLM</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Central SLM Ecosystem Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '9999px',
          background: 'rgba(37, 99, 235, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          marginBottom: '1.75rem',
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)'
        }}>
          <Sparkles size={16} color="#60a5fa" />
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#93c5fd', letterSpacing: '0.02em' }}>
            Central SLM Identity & Multi-Tenant Telephony Pro
          </span>
          <span style={{
            fontSize: '0.68rem',
            padding: '2px 8px',
            borderRadius: '9999px',
            backgroundColor: '#2563eb',
            color: '#fff',
            fontWeight: 700
          }}>
            v2.4
          </span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: '-0.03em',
          maxWidth: '920px',
          margin: '0 auto 1.5rem',
          color: '#ffffff'
        }}>
          Supercharge Your Inbound & Outbound{' '}
          <span style={{
            background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Calling Pipeline
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p style={{
          fontSize: 'clamp(1.05rem, 1.8vw, 1.22rem)',
          lineHeight: 1.6,
          color: '#94a3b8',
          maxWidth: '720px',
          margin: '0 auto 2.5rem'
        }}>
          High-performance smart queueing, rapid disposition tracking, and enterprise-grade multi-tenant data isolation. Built for modern sales and telecalling teams.
        </p>

        {/* Dual CTAs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '4rem'
        }}>
          <button
            onClick={handleStartAuth}
            style={{
              padding: '14px 32px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <span>{user ? 'Go to Workspace Dashboard' : 'Get Started Free (via SLM)'}</span>
            <ArrowRight size={18} />
          </button>

          <a
            href="https://apps.ajaywebservices.in/apps"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '14px 26px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#cbd5e1',
              fontSize: '1rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)')}
          >
            <span>Explore App Hub</span>
            <ExternalLink size={16} />
          </a>
        </div>

        {/* Live Glassmorphic Dialer & Pipeline Preview */}
        <div id="dialer" style={{
          maxWidth: '1080px',
          margin: '0 auto',
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          padding: '1.75rem',
          textAlign: 'left'
        }}>
          {/* Mock Window Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              <span style={{ marginLeft: '12px', fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>
                telecall-crm.live/pipeline/active-session
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
                SIP Trunk Active
              </span>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Latency: <strong style={{ color: '#38bdf8' }}>24ms</strong>
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Total Outbound Dials</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>4,820</div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>↑ 18.4% today</div>
            </div>
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Connection Rate</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>98.4%</div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '2px' }}>Zero dropped calls</div>
            </div>
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Conversion / Interested</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a78bfa' }}>24.6%</div>
              <div style={{ fontSize: '0.7rem', color: '#a78bfa', marginTop: '2px' }}>118 deals closed</div>
            </div>
            <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '4px' }}>Active Queue Length</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>14 Leads</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>Auto-distributing</div>
            </div>
          </div>

          {/* Simulated Active Call Bar */}
          <div style={{
            background: 'linear-gradient(90deg, rgba(37, 99, 235, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                position: 'relative'
              }}>
                <PhoneCall size={20} />
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  border: '2px solid #0f172a'
                }}></span>
              </div>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  {mockQueue[activeLeadIndex].name} • <span style={{ color: '#93c5fd', fontSize: '0.85rem' }}>{mockQueue[activeLeadIndex].company}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  {mockQueue[activeLeadIndex].phone} • Queue Category: <strong style={{ color: '#cbd5e1' }}>{mockQueue[activeLeadIndex].category}</strong>
                </div>
              </div>
            </div>

            {/* Disposition Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginRight: '4px' }}>Quick Dispositions:</span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.74rem', fontWeight: 600 }}>
                Interested
              </span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontSize: '0.74rem', fontWeight: 600 }}>
                Follow-Up
              </span>
              <span style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '0.74rem', fontWeight: 600 }}>
                DND
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section id="features" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '5rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Built for High-Velocity Telecallers
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#fff', marginTop: '8px' }}>
            Everything You Need to Convert Leads at Scale
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Feature 1 */}
          <div style={{
            padding: '2rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            transition: 'all 0.2s'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Zap size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
              Automated Lead Distribution
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Route high-value leads automatically based on category, source, and agent capacity. Reduce speed-to-dial to under 30 seconds.
            </p>
          </div>

          {/* Feature 2 */}
          <div style={{
            padding: '2rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Sliders size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
              Zero-Friction Dispositions
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Log call outcomes, schedule follow-ups, and trigger WhatsApp or email notifications with a single click during active calls.
            </p>
          </div>

          {/* Feature 3 */}
          <div style={{
            padding: '2rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
              Strict Multi-Tenancy
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Enterprise data isolation engine automatically scopes all leads, call recordings, and settings per organization. Zero cross-tenant leakage.
            </p>
          </div>

          {/* Feature 4 */}
          <div style={{
            padding: '2rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <Shield size={22} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '0.6rem' }}>
              Central SLM SSO & Revocation
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6 }}>
              Cryptographic OIDC S256 PKCE handshake with instant Backchannel Logout 1.0 synchronization across the entire ecosystem.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Matrix */}
      <section id="pricing" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '5rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Simple & Transparent Plans
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#fff', marginTop: '8px' }}>
            Ready for Individuals and Growing Call Centers
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'stretch'
        }}>
          {/* Starter Plan */}
          <div style={{
            padding: '2.5rem 2rem',
            borderRadius: '18px',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Starter Free</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 1.5rem' }}>Included with your free Central SLM Identity.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>
              $0 <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>/ forever</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" /> 1 Personal Telecaller Seat
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" /> Up to 500 Leads & Call Logs
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" /> Manual & CSV Bulk Import
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" /> Central SLM SSO Included
              </li>
            </ul>

            <button
              onClick={handleStartAuth}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sign Up via SLM
            </button>
          </div>

          {/* Growth Pro Plan (Featured) */}
          <div style={{
            padding: '2.5rem 2rem',
            borderRadius: '18px',
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            border: '2px solid #3b82f6',
            boxShadow: '0 20px 40px rgba(37, 99, 235, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '3px 12px',
              borderRadius: '9999px',
              backgroundColor: '#2563eb',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Most Popular
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Growth Pro</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 1.5rem' }}>For active telecalling teams & agencies.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>
              $29 <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#fff' }}>
                <CheckCircle2 size={16} color="#3b82f6" /> Up to 5 Team Members
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#fff' }}>
                <CheckCircle2 size={16} color="#3b82f6" /> Unlimited Leads & Calling Pipelines
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#fff' }}>
                <CheckCircle2 size={16} color="#3b82f6" /> Audio Recording & Cloud Backups
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#fff' }}>
                <CheckCircle2 size={16} color="#3b82f6" /> Multi-Tenant Business Isolation
              </li>
            </ul>

            <a
              href="https://apps.ajaywebservices.in/billing/checkout?product=telecall-crm"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                color: '#fff',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)'
              }}
            >
              Subscribe via SLM Checkout
            </a>
          </div>

          {/* Enterprise Suite Plan */}
          <div style={{
            padding: '2.5rem 2rem',
            borderRadius: '18px',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>Enterprise Suite</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '4px 0 1.5rem' }}>Large-scale centers with custom VoIP trunks.</p>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: '1.5rem' }}>
              $89 <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 400 }}>/ month</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" /> Unlimited Agents & Custom Roles
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" /> Dedicated Cloud PBX / SIP Trunking
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" /> Full Workflow FMS Ecosystem Sync
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#cbd5e1' }}>
                <CheckCircle2 size={16} color="#10b981" /> 24/7 SLA & Dedicated Priority Support
              </li>
            </ul>

            <a
              href="https://apps.ajaywebservices.in/billing/checkout?product=telecall-crm"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              Contact & Checkout
            </a>
          </div>
        </div>
      </section>

      {/* Unified Ecosystem Banner */}
      <section id="ecosystem" style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '4rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          padding: '3rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '2rem'
        }}>
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              One Account • Unified SaaS Suite
            </span>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: '6px 0 10px' }}>
              Part of the AjayWebServices Central SLM Platform
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', maxWidth: '600px', lineHeight: 1.6, margin: 0 }}>
              Seamlessly switch between Workflow FMS for task execution and Telecall CRM for client engagement without re-authenticating.
            </p>
          </div>

          <a
            href="https://apps.ajaywebservices.in/apps"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)'
            }}
          >
            <span>Browse All Ecosystem Apps</span>
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#060911',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        padding: '3rem 1.5rem',
        color: '#64748b'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
              Telecall<span style={{ color: '#3b82f6' }}>CRM</span> Pro
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
              © {new Date().getFullYear()} AjayWebServices.in. All rights reserved.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
            <a href="https://workflow.ajaywebservices.in" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>Workflow FMS</a>
            <a href="https://apps.ajaywebservices.in/apps" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>App Hub</a>
            <a href="https://apps.ajaywebservices.in/subscription" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>Billing</a>
            <a href="https://app.ajaywebservices.in" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none' }}>Central SLM</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
