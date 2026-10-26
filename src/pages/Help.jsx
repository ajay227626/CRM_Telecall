import React, { useState, useEffect } from 'react';
import { getUser } from '../utils/permissions';
import MarkdownViewer from '../components/MarkdownViewer';
import axios from 'axios';

const Help = () => {
    const [activeSection, setActiveSection] = useState('getting-started');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedItems, setExpandedItems] = useState(new Set(['getting-started']));
    const [user, setUser] = useState(null);
    const [viewingGuide, setViewingGuide] = useState(null); // Track which guide is being viewed
    const [videoModal, setVideoModal] = useState({ show: false, src: '', title: '' }); // Video modal state
    const [adminContacts, setAdminContacts] = useState([]); // Store admin contact information

    useEffect(() => {
        const currentUser = getUser();
        setUser(currentUser);

        // Fetch admin users for contact information
        const fetchAdminContacts = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Filter for Admin and SuperAdmin users with contact info
                const admins = response.data.filter(user =>
                    (user.role === 'Admin' || user.role === 'SuperAdmin') &&
                    user.status === 'Active' &&
                    user.email
                );

                setAdminContacts(admins);
            } catch (error) {
                console.error('Error fetching admin contacts:', error);
            }
        };

        fetchAdminContacts();
    }, []);

    const toggleSection = (sectionId) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedItems(newExpanded);
    };

    // Define all help sections with role requirements
    const allSections = [
        {
            id: 'getting-started',
            title: 'Getting Started',
            icon: 'ri-rocket-line',
            roles: ['all'],
            content: {
                overview: 'Welcome to Telecall CRM! This guide will help you get started with the essential features.',
                steps: [
                    { title: 'Dashboard Overview', desc: 'Understand your main dashboard and key metrics' },
                    { title: 'Navigation', desc: 'Learn how to navigate between different sections' },
                    { title: 'Quick Actions', desc: 'Common tasks you can perform quickly' }
                ],
                videos: []
            }
        },
        {
            id: 'dashboard',
            title: 'Dashboard',
            icon: 'ri-dashboard-line',
            roles: ['all'],
            content: {
                overview: 'The dashboard provides an at-a-glance view of your key metrics and recent activity.',
                steps: [
                    { title: 'Viewing Stats', desc: 'See total leads, calls, and activity counts' },
                    { title: 'Recent Leads', desc: 'Quick access to newly added leads' },
                    { title: 'Activity Feed', desc: 'Track team activities in real-time' }
                ],
                videos: [
                    { title: 'Dashboard Tour', url: '/help/videos/dashboard_tour.webp', type: 'video' }
                ]
            }
        },
        {
            id: 'leads',
            title: 'Lead Management',
            icon: 'ri-user-star-line',
            roles: ['all'],
            content: {
                overview: 'Manage your leads effectively with our comprehensive lead management system.',
                steps: [
                    { title: 'Creating a Lead', desc: 'Click the "Add Lead" button and fill in contact information' },
                    { title: 'Editing Leads', desc: 'Click on any lead to view details and make updates' },
                    { title: 'Lead Categories', desc: 'Organize leads by Hot, Warm, or Cold categories' },
                    { title: 'Lead Status', desc: 'Track progress with New, Contacted, Qualified, or Closed statuses' },
                    { title: 'Assignment', desc: 'Assign leads to team members for follow-up' },
                    { title: 'Filtering', desc: 'Use filters to find specific leads quickly' },
                    { title: 'Bulk Actions', desc: 'Select multiple leads and perform actions in bulk' }
                ],
                tips: [
                    'Always add notes when updating a lead status',
                    'Use categories to prioritize your follow-ups',
                    'Set follow-up dates to never miss an opportunity'
                ],
                videos: [
                    { title: 'Creating a New Lead', url: '/help/videos/lead_creation.webp', type: 'video' },
                    { title: 'Created Lead Example', url: '/help/screenshots/lead_created.png', type: 'image' }
                ]
            }
        },
        {
            id: 'calls',
            title: 'Call Logging',
            icon: 'ri-phone-line',
            roles: ['all'],
            content: {
                overview: 'Log and track all your calls directly from the CRM.',
                steps: [
                    { title: 'Making a Call', desc: 'Click the phone icon next to any lead to initiate a call' },
                    { title: 'Call Controls', desc: 'Use mute, hold, and end call buttons during the call' },
                    { title: 'Adding Notes', desc: 'Add call notes and outcomes after each call' },
                    { title: 'Call History', desc: 'View all past calls in the Call Logs section' },
                    { title: 'Call Duration', desc: 'Track how long each call lasted' }
                ],
                tips: [
                    'Always add notes immediately after a call',
                    'Use the call outcome to track success rates',
                    'Review call logs weekly to identify patterns'
                ],
                videos: [
                    { title: 'Making a Call Tutorial', url: '/help/videos/call_logging.webp', type: 'video' }
                ]
            }
        },
        {
            id: 'profile',
            title: 'Profile Settings',
            icon: 'ri-user-settings-line',
            roles: ['all'],
            content: {
                overview: 'Customize your profile and manage your account settings.',
                steps: [
                    { title: 'Changing Avatar', desc: 'Upload a custom photo or select from Google/Facebook/Microsoft avatars' },
                    { title: 'Updating Password', desc: 'Change your password from the Security Settings tab' },
                    { title: 'Account Linking', desc: 'Link Google, Facebook, or Microsoft accounts for easy login' },
                    { title: 'Security Settings', desc: 'Enable OTP, manage linked accounts, and review login history' }
                ],
                videos: [
                    { title: 'Profile Customization', url: '/help/videos/profile_customization.webp', type: 'video' },
                    { title: 'Profile Overview', url: '/help/screenshots/profile_overview.png', type: 'image' },
                    { title: 'Updated Profile', url: '/help/screenshots/profile_updated.png', type: 'image' }
                ]
            }
        },
        {
            id: 'users',
            title: 'User Management',
            icon: 'ri-team-line',
            roles: ['Admin', 'SuperAdmin', 'Moderator'],
            content: {
                overview: 'Manage users, roles, and permissions across your organization.',
                steps: [
                    { title: 'Adding Users', desc: 'Click "Add User" and fill in user details including role and department' },
                    { title: 'Editing Users', desc: 'Click edit icon to modify user information' },
                    { title: 'Role Assignment', desc: 'Assign system roles (Admin, Moderator) or custom roles' },
                    { title: 'Departments', desc: 'Create and manage departments for better organization' },
                    { title: 'Activating/Deactivating', desc: 'Control user access by activating or deactivating accounts' },
                    { title: 'Deleting Users', desc: 'Permanently remove users from the system' }
                ],
                videos: []
            }
        },
        {
            id: 'departments',
            title: 'Department Management',
            icon: 'ri-building-line',
            roles: ['Admin', 'SuperAdmin'],
            content: {
                overview: 'Organize your team into departments for better structure.',
                steps: [
                    { title: 'Creating Departments', desc: 'Go to Profile → Moderation → Departments' },
                    { title: 'Adding Members', desc: 'Assign users to departments when creating/editing users' },
                    { title: 'Viewing Departments', desc: 'See all departments and member counts' },
                    { title: 'Editing Departments', desc: 'Rename or update department details' },
                    { title: 'Deleting Departments', desc: 'Remove unused departments (reassign members first)' }
                ],
                videos: []
            }
        },
        {
            id: 'settings',
            title: 'Settings Configuration',
            icon: 'ri-settings-3-line',
            roles: ['Admin', 'SuperAdmin', 'Moderator'],
            content: {
                overview: 'Configure system-wide settings for API, calling, leads, and more.',
                steps: [
                    { title: 'API Settings', desc: 'Configure API keys and endpoints for integrations' },
                    { title: 'Calling Settings', desc: 'Set up calling preferences and defaults' },
                    { title: 'Lead Settings', desc: 'Configure lead categories, statuses, and sources' },
                    { title: 'System Settings', desc: 'Manage general system configurations' },
                    { title: 'Templates', desc: 'Create and manage email/SMS templates' }
                ],
                videos: []
            }
        },
        {
            id: 'meta-integration',
            title: 'Meta Lead Ads Integration',
            icon: 'ri-facebook-fill',
            roles: ['Admin', 'SuperAdmin', 'Moderator'],
            content: {
                overview: 'Connect Facebook/Instagram Lead Ads to automatically sync leads into your CRM.',
                steps: [
                    { title: 'Platform Setup', desc: 'Create Meta App and configure webhooks (see detailed guide below)' },
                    { title: 'Connecting Account', desc: 'Go to Settings → Meta Integrations → Add Meta Account' },
                    { title: 'OAuth Authorization', desc: 'Login to Facebook and select pages to connect' },
                    { title: 'Configuring Integration', desc: 'Set account name, description, and lead assignment strategy' },
                    { title: 'Lead Assignment', desc: 'Choose: Unassigned, Specific User, or Round Robin' },
                    { title: 'Managing Accounts', desc: 'Edit, sync, or delete integrations as needed' },
                    { title: 'Viewing Leads', desc: 'Leads appear in Leads page with source "Meta"' }
                ],
                guides: [
                    { title: 'Platform Admin Setup Guide', file: 'meta_admin_setup_guide.md', desc: 'Technical setup of Meta App, webhooks, and credentials' },
                    { title: 'CRM Admin User Guide', file: 'meta_crm_admin_guide.md', desc: 'Using Meta integrations in the CRM' }
                ],
                videos: []
            }
        },
        {
            id: 'troubleshooting',
            title: 'Troubleshooting',
            icon: 'ri-error-warning-line',
            roles: ['all'],
            content: {
                overview: 'Solutions to common issues and problems.',
                faqs: [
                    { q: 'I can\'t log in', a: 'Check your email and password. Use "Forgot Password" if needed. Contact your admin if you\'re locked out.' },
                    { q: 'Calls aren\'t working', a: 'Ensure calling settings are configured (Settings → Calling). Check your browser permissions for microphone access.' },
                    { q: 'I don\'t see certain menu items', a: 'Your access is based on your role. Contact your admin if you need additional permissions.' },
                    { q: 'Leads aren\'t syncing from Meta', a: 'Check integration status in Settings → Meta Integrations. Ensure webhook is "Active". Try manual sync.' },
                    { q: 'I can\'t add users', a: 'Only Admins and SuperAdmins can add users. Check your role in Profile.' }
                ]
            }
        }
    ];

    // Filter sections based on user role
    const visibleSections = user ? allSections.filter(section =>
        section.roles.includes('all') ||
        section.roles.includes(user.role)
    ) : allSections.filter(s => s.roles.includes('all'));

    // Filter by search query
    const filteredSections = searchQuery
        ? visibleSections.filter(section =>
            section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            section.content.overview?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : visibleSections;

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>
            {/* Sidebar */}
            <div style={{
                width: '280px',
                background: 'var(--bg-card)',
                borderRight: '1px solid var(--border)',
                overflowY: 'auto',
                padding: '1.5rem 0'
            }}>
                <div style={{ padding: '0 1.5rem 1.5rem' }}>
                    <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: 'var(--text-main)' }}>
                        <i className="ri-book-open-line" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
                        Help Center
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Guides and documentation
                    </p>
                </div>

                {/* Search */}
                <div style={{ padding: '0 1.5rem 1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <i className="ri-search-line" style={{
                            position: 'absolute',
                            left: '0.75rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-secondary)'
                        }}></i>
                        <input
                            type="text"
                            placeholder="Search help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.75rem 0.625rem 2.5rem',
                                border: '1px solid var(--border)',
                                borderRadius: '0.5rem',
                                background: 'var(--bg-main)',
                                color: 'var(--text-main)',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>
                </div>

                {/* Navigation */}
                <nav>
                    {filteredSections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => {
                                setActiveSection(section.id);
                                setViewingGuide(null); // Clear guide viewer when switching sections
                            }}
                            style={{
                                width: '100%',
                                padding: '0.875rem 1.5rem',
                                border: 'none',
                                background: activeSection === section.id ? 'var(--primary-light)' : 'transparent',
                                color: activeSection === section.id ? 'var(--primary)' : 'var(--text-main)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                fontSize: '0.9375rem',
                                fontWeight: activeSection === section.id ? '600' : '500',
                                transition: 'all 0.2s',
                                borderLeft: activeSection === section.id ? '3px solid var(--primary)' : '3px solid transparent'
                            }}
                            onMouseEnter={(e) => {
                                if (activeSection !== section.id) {
                                    e.currentTarget.style.background = 'var(--bg-hover)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeSection !== section.id) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <i className={section.icon} style={{ fontSize: '1.25rem' }}></i>
                            <span>{section.title}</span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: viewingGuide ? '0 3rem 2rem 3rem' : '2rem 3rem'
            }}>
                {/* If viewing a guide, show markdown viewer */}
                {viewingGuide ? (
                    <MarkdownViewer
                        filePath={viewingGuide}
                        onBack={() => setViewingGuide(null)}
                    />
                ) : (
                    filteredSections.map(section => {
                        if (section.id !== activeSection) return null;

                        return (
                            <div key={section.id}>
                                {/* Section Header */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '14px',
                                            background: 'var(--primary-light)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <i className={section.icon} style={{ fontSize: '28px', color: 'var(--primary)' }}></i>
                                        </div>
                                        <div>
                                            <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-main)' }}>
                                                {section.title}
                                            </h1>
                                            {!section.roles.includes('all') && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    marginTop: '0.25rem',
                                                    padding: '0.25rem 0.75rem',
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.75rem',
                                                    fontWeight: '600'
                                                }}>
                                                    Admin Only
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '1.125rem',
                                        color: 'var(--text-secondary)',
                                        lineHeight: '1.6'
                                    }}>
                                        {section.content.overview}
                                    </p>
                                </div>

                                {/* Steps */}
                                {section.content.steps && section.content.steps.length > 0 && (
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <h2 style={{
                                            fontSize: '1.5rem',
                                            marginBottom: '1.25rem',
                                            color: 'var(--text-main)'
                                        }}>
                                            Step-by-Step Guide
                                        </h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {section.content.steps.map((step, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '1.25rem',
                                                        background: 'var(--bg-card)',
                                                        borderRadius: '0.75rem',
                                                        border: '1px solid var(--border)',
                                                        display: 'flex',
                                                        gap: '1rem'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: 'var(--primary)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: '700',
                                                        flexShrink: 0
                                                    }}>
                                                        {index + 1}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <h3 style={{
                                                            margin: '0 0 0.5rem 0',
                                                            fontSize: '1.125rem',
                                                            color: 'var(--text-main)'
                                                        }}>
                                                            {step.title}
                                                        </h3>
                                                        <p style={{
                                                            margin: 0,
                                                            color: 'var(--text-secondary)',
                                                            lineHeight: '1.6'
                                                        }}>
                                                            {step.desc}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Videos & Screenshots */}
                                {section.content.videos && section.content.videos.length > 0 && (
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <h2 style={{
                                            fontSize: '1.5rem',
                                            marginBottom: '1.25rem',
                                            color: 'var(--text-main)'
                                        }}>
                                            Video Tutorials & Screenshots
                                        </h2>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                                            {section.content.videos.map((video, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        background: 'var(--bg-card)',
                                                        borderRadius: '0.75rem',
                                                        border: '1px solid var(--border)',
                                                        overflow: 'hidden',
                                                        transition: 'transform 0.2s, box-shadow 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '100%',
                                                        height: '250px',
                                                        background: 'var(--bg-main)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        position: 'relative'
                                                    }}>
                                                        {video.url && (() => {
                                                            // Check if it's an image file
                                                            const isImage = video.url.match(/\.(webp|png|jpg|jpeg|gif|svg)$/i);

                                                            if (isImage || video.type === 'image') {
                                                                return (
                                                                    <img
                                                                        src={video.url}
                                                                        alt={video.title}
                                                                        onClick={() => setVideoModal({ show: true, src: video.url, title: video.title })}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            objectFit: 'contain',
                                                                            cursor: 'pointer',
                                                                            transition: 'transform 0.2s'
                                                                        }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                                    />
                                                                );
                                                            } else {
                                                                // It's a video file
                                                                return (
                                                                    <div
                                                                        onClick={() => setVideoModal({ show: true, src: video.url, title: video.title })}
                                                                        style={{
                                                                            width: '100%',
                                                                            height: '100%',
                                                                            cursor: 'pointer',
                                                                            position: 'relative',
                                                                            overflow: 'hidden',
                                                                            background: '#000',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center'
                                                                        }}
                                                                    >
                                                                        <video
                                                                            src={video.url}
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                                pointerEvents: 'none'
                                                                            }}
                                                                        />
                                                                        <div style={{
                                                                            position: 'absolute',
                                                                            top: '50%',
                                                                            left: '50%',
                                                                            transform: 'translate(-50%, -50%)',
                                                                            background: 'rgba(0, 0, 0, 0.6)',
                                                                            borderRadius: '50%',
                                                                            width: '60px',
                                                                            height: '60px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center',
                                                                            backdropFilter: 'blur(4px)'
                                                                        }}>
                                                                            <i className="ri-play-fill" style={{
                                                                                color: 'white',
                                                                                fontSize: '2rem',
                                                                                marginLeft: '4px'
                                                                            }}></i>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                        })()}</div>
                                                    <div style={{ padding: '1rem' }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            marginBottom: '0.25rem'
                                                        }}>
                                                            <i className={video.type === 'video' ? 'ri-video-line' : 'ri-image-line'} style={{ color: 'var(--primary)' }}></i>
                                                            <h3 style={{
                                                                margin: 0,
                                                                fontSize: '1.0625rem',
                                                                color: 'var(--text-main)',
                                                                fontWeight: '600'
                                                            }}>
                                                                {video.title}
                                                            </h3>
                                                        </div>
                                                        <p style={{
                                                            margin: '0.25rem 0 0 1.75rem',
                                                            fontSize: '0.8125rem',
                                                            color: 'var(--text-secondary)'
                                                        }}>
                                                            {video.type === 'video' ? 'Interactive tutorial' : 'Screenshot'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Tips */}
                                {section.content.tips && section.content.tips.length > 0 && (
                                    <div style={{
                                        marginBottom: '2.5rem',
                                        padding: '1.5rem',
                                        background: 'linear-gradient(135deg, var(--primary-light), rgba(var(--primary-rgb), 0.05))',
                                        borderRadius: '0.75rem',
                                        border: '1px solid var(--primary)'
                                    }}>
                                        <h3 style={{
                                            margin: '0 0 1rem 0',
                                            fontSize: '1.25rem',
                                            color: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <i className="ri-lightbulb-line"></i>
                                            Pro Tips
                                        </h3>
                                        <ul style={{
                                            margin: 0,
                                            paddingLeft: '1.5rem',
                                            color: 'var(--text-main)'
                                        }}>
                                            {section.content.tips.map((tip, index) => (
                                                <li key={index} style={{ marginBottom: '0.5rem' }}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Guides (for Meta integration) */}
                                {section.content.guides && section.content.guides.length > 0 && (
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <h2 style={{
                                            fontSize: '1.5rem',
                                            marginBottom: '1.25rem',
                                            color: 'var(--text-main)'
                                        }}>
                                            Detailed Setup Guides
                                        </h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {section.content.guides.map((guide, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '1.5rem',
                                                        background: 'var(--bg-card)',
                                                        borderRadius: '0.75rem',
                                                        border: '1px solid var(--border)'
                                                    }}
                                                >
                                                    <h3 style={{
                                                        margin: '0 0 0.5rem 0',
                                                        fontSize: '1.125rem',
                                                        color: 'var(--text-main)'
                                                    }}>
                                                        <i className="ri-file-text-line" style={{ marginRight: '0.5rem', color: 'var(--primary)' }}></i>
                                                        {guide.title}
                                                    </h3>
                                                    <p style={{
                                                        margin: '0 0 1rem 0',
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '0.9375rem'
                                                    }}>
                                                        {guide.desc}
                                                    </p>
                                                    <button
                                                        onClick={() => setViewingGuide(`/help/${guide.file}`)}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.5rem',
                                                            padding: '0.625rem 1.25rem',
                                                            background: 'var(--primary)',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '0.5rem',
                                                            fontSize: '0.9375rem',
                                                            fontWeight: '600',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                                    >
                                                        <i className="ri-book-read-line"></i>
                                                        Open Guide
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* FAQs */}
                                {section.content.faqs && section.content.faqs.length > 0 && (
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <h2 style={{
                                            fontSize: '1.5rem',
                                            marginBottom: '1.25rem',
                                            color: 'var(--text-main)'
                                        }}>
                                            Frequently Asked Questions
                                        </h2>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {section.content.faqs.map((faq, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        padding: '1.25rem',
                                                        background: 'var(--bg-card)',
                                                        borderRadius: '0.75rem',
                                                        border: '1px solid var(--border)'
                                                    }}
                                                >
                                                    <h3 style={{
                                                        margin: '0 0 0.75rem 0',
                                                        fontSize: '1.0625rem',
                                                        color: 'var(--text-main)',
                                                        display: 'flex',
                                                        alignItems: 'start',
                                                        gap: '0.5rem'
                                                    }}>
                                                        <i className="ri-question-line" style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '0.125rem' }}></i>
                                                        {faq.q}
                                                    </h3>
                                                    <p style={{
                                                        margin: '0 0 0 1.75rem',
                                                        color: 'var(--text-secondary)',
                                                        lineHeight: '1.6'
                                                    }}>
                                                        {faq.a}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Need More Help */}
                                <div style={{
                                    marginTop: '3rem',
                                    padding: '2rem',
                                    background: 'var(--bg-card)',
                                    borderRadius: '1rem',
                                    border: '2px dashed var(--border)',
                                    textAlign: 'center'
                                }}>
                                    <i className="ri-customer-service-2-line" style={{
                                        fontSize: '48px',
                                        color: 'var(--primary)',
                                        marginBottom: '1rem'
                                    }}></i>
                                    <h3 style={{
                                        margin: '0 0 0.5rem 0',
                                        fontSize: '1.25rem',
                                        color: 'var(--text-main)'
                                    }}>
                                        Still Need Help?
                                    </h3>
                                    <p style={{
                                        margin: '0 0 1.5rem 0',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        Contact your system administrator or CRM support team
                                    </p>

                                    {/* Admin Contacts */}
                                    {adminContacts.length > 0 && (
                                        <div style={{
                                            marginTop: '1.5rem',
                                            padding: '1.5rem',
                                            background: 'var(--bg-main)',
                                            borderRadius: '0.75rem',
                                            textAlign: 'left'
                                        }}>
                                            <h4 style={{
                                                margin: '0 0 1rem 0',
                                                fontSize: '1rem',
                                                color: 'var(--text-main)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                justifyContent: 'center'
                                            }}>
                                                <i className="ri-admin-line" style={{ color: 'var(--primary)' }}></i>
                                                Administrator Contacts
                                            </h4>
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1rem'
                                            }}>
                                                {adminContacts.map((admin, index) => (
                                                    <div key={index} style={{
                                                        padding: '1rem',
                                                        background: 'var(--bg-card)',
                                                        borderRadius: '0.5rem',
                                                        border: '1px solid var(--border)'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '0.75rem',
                                                            marginBottom: '0.5rem'
                                                        }}>
                                                            <i className="ri-shield-user-line" style={{
                                                                fontSize: '1.25rem',
                                                                color: 'var(--primary)'
                                                            }}></i>
                                                            <div>
                                                                <div style={{
                                                                    fontWeight: '600',
                                                                    color: 'var(--text-main)',
                                                                    marginBottom: '0.125rem'
                                                                }}>
                                                                    {admin.name}
                                                                </div>
                                                                <div style={{
                                                                    fontSize: '0.75rem',
                                                                    color: 'var(--text-secondary)',
                                                                    textTransform: 'uppercase',
                                                                    fontWeight: '500'
                                                                }}>
                                                                    {admin.role}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '0.5rem',
                                                            marginLeft: '2rem'
                                                        }}>
                                                            {admin.email && (
                                                                <a
                                                                    href={`mailto:${admin.email}`}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                        color: 'var(--primary)',
                                                                        textDecoration: 'none',
                                                                        fontSize: '0.875rem',
                                                                        transition: 'opacity 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                                >
                                                                    <i className="ri-mail-line"></i>
                                                                    {admin.email}
                                                                </a>
                                                            )}
                                                            {admin.phone && (
                                                                <a
                                                                    href={`tel:${admin.phone}`}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.5rem',
                                                                        color: 'var(--primary)',
                                                                        textDecoration: 'none',
                                                                        fontSize: '0.875rem',
                                                                        transition: 'opacity 0.2s'
                                                                    }}
                                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                                                >
                                                                    <i className="ri-phone-line"></i>
                                                                    {admin.phone}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Video Modal */}
            {videoModal.show && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: '2rem'
                    }}
                    onClick={() => setVideoModal({ show: false, src: '', title: '' })}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            width: '1200px',
                            display: 'flex',
                            flexDirection: 'column',
                            border: '1px solid var(--border)',
                            resize: 'both'
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-main)',
                            cursor: 'move'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <i className={videoModal.src.match(/\.(webp|png|jpg|jpeg|gif|svg)$/i) ? 'ri-image-line' : 'ri-play-circle-line'} style={{
                                    fontSize: '1.5rem',
                                    color: 'var(--primary)'
                                }}></i>
                                <h3 style={{
                                    margin: 0,
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: 'var(--text-main)'
                                }}>
                                    {videoModal.title}
                                </h3>
                            </div>
                            <button
                                onClick={() => setVideoModal({ show: false, src: '', title: '' })}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    padding: '0.25rem',
                                    borderRadius: '0.375rem',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'var(--bg-hover)';
                                    e.currentTarget.style.color = 'var(--text-main)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#000',
                            minHeight: '400px'
                        }}>
                            {(() => {
                                // Check if it's an image file
                                const isImage = videoModal.src.match(/\.(webp|png|jpg|jpeg|gif|svg)$/i);

                                if (isImage) {
                                    return (
                                        <img
                                            src={videoModal.src}
                                            alt={videoModal.title}
                                            style={{
                                                maxWidth: '100%',
                                                maxHeight: '100%',
                                                objectFit: 'contain'
                                            }}
                                        />
                                    );
                                } else {
                                    return (
                                        <video
                                            src={videoModal.src}
                                            controls
                                            autoPlay
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                maxHeight: '70vh'
                                            }}
                                        />
                                    );
                                }
                            })()}
                        </div>

                        {/* Resize Handle */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '20px',
                            height: '20px',
                            cursor: 'nwse-resize',
                            opacity: 0.5
                        }}>
                            <i className="ri-drag-move-2-fill" style={{
                                fontSize: '1.25rem',
                                color: 'var(--text-secondary)'
                            }}></i>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Help;
