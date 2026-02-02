import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppearance } from '../context/AppearanceContext';
import { usePermissions } from '../hooks/usePermissions';
import { CallProvider } from '../context/CallContext';
import DialerWidget from '../components/Dialer/DialerWidget';

const Sidebar = ({ user, onLogout, collapsed, toggleCollapse }) => {
    const { appearance, general, toggleTheme } = useAppearance();
    const { hasPermission } = usePermissions();
    const { t } = useTranslation();
    const theme = appearance.theme;

    const navItems = [
        { icon: <i className="ri-dashboard-line"></i>, labelKey: 'sidebar.dashboard', path: '/', permission: { resource: 'dashboard', action: 'view' } },
        { icon: <i className="ri-user-follow-line"></i>, labelKey: 'sidebar.leads', path: '/leads', permission: { resource: 'leads', action: 'view' } },
        { icon: <i className="ri-phone-line"></i>, labelKey: 'sidebar.callLogs', path: '/call-logs', permission: { resource: 'calls', action: 'view' } },
        { icon: <i className="ri-settings-4-line"></i>, labelKey: 'sidebar.settings', path: '/settings', permission: { resource: 'settings', action: 'view' } },
        { icon: <i className="ri-question-line"></i>, labelKey: 'sidebar.help', path: '/help', permission: null }, // Available to all users
    ];

    const filteredNavItems = navItems.filter(item =>
        !item.permission || hasPermission(item.permission.resource, item.permission.action)
    );

    const getSidebarClass = () => {
        let classes = ["app-sidebar"];
        if (appearance.sidebarStyle === 'classic') classes.push("sidebar-classic");
        if (appearance.sidebarStyle === 'minimal') classes.push("sidebar-minimal");
        if (collapsed) classes.push("collapsed");
        return classes.join(" ");
    };

    return (
        <aside className={getSidebarClass()}>
            <div className="sidebar-logo">
                <h2>{general?.companyName || 'CRM Pro'}</h2>
                <button className="sidebar-toggle" style={collapsed ? { fontSize: "1.5rem" } : { fontSize: "1rem" }} onClick={toggleCollapse}>
                    <i className={collapsed ? "ri-indent-increase" : "ri-indent-decrease"}></i>
                </button>
            </div>

            <nav className="sidebar-nav">
                {filteredNavItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        title={collapsed ? t(item.labelKey) : ''}
                    >
                        {item.icon}
                        <span>{t(item.labelKey)}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="theme-toggle-btn" onClick={toggleTheme} title={collapsed ? t('common.theme') : ""}>
                    <i className={theme === 'light' ? "ri-moon-line" : "ri-sun-line"}></i>
                    <div>{theme === 'light' ? t('settings.darkTheme') : t('settings.lightTheme')}</div>
                </button>

                <NavLink to="/profile" className="user-profile-badge">
                    <div className="user-avatar">
                        {user?.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    borderRadius: '50%',
                                    objectFit: 'cover'
                                }}
                            />
                        ) : (
                            user?.name?.charAt(0) || 'U'
                        )}
                    </div>
                    <div className="user-info">
                        <p className="user-name">{user?.name || 'User'}</p>
                        <p className="user-role">{user?.role || user?.systemRole || 'Guest'}</p>
                    </div>
                    <i className="ri-arrow-right-s-line" style={{ color: '#9CA3AF' }}></i>
                </NavLink>

                <button className="logout-btn" onClick={onLogout} title={collapsed ? t('sidebar.logout') : ""}>
                    <i className="ri-logout-box-r-line"></i>
                    <div>{t('sidebar.logout')}</div>
                </button>
            </div>
        </aside>
    );
};

const DashboardLayout = ({ user, onLogout }) => {
    const [collapsed, setCollapsed] = React.useState(localStorage.getItem('sidebar-collapsed') === 'true');

    const toggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', newState);
        document.documentElement.setAttribute('data-sidebar-collapsed', newState);
    };

    return (
        <CallProvider>
            <div className={`dashboard-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
                <Sidebar
                    user={user}
                    onLogout={onLogout}
                    collapsed={collapsed}
                    toggleCollapse={toggleCollapse}
                />
                <main className="main-content">
                    <Outlet />
                </main>
                <DialerWidget />
            </div>
        </CallProvider>
    );
};

export default DashboardLayout;
