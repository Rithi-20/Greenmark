import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, QrCode, Sprout, Upload, Gift, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const UserSidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        { path: '/user/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/user/register-sapling', icon: QrCode, label: 'Register Plant' },
        { path: '/user/my-forest', icon: Sprout, label: 'My Saplings' },
        { path: '/user/rewards', icon: Gift, label: 'Rewards' },
        { path: '/user/settings', icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col">
            <div className="p-6 border-b border-gray-100">
                <h1 className="text-2xl font-bold text-green-600 tracking-tight">GreenMark</h1>
                <p className="text-xs text-gray-400 mt-1">User Portal</p>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${isActive(item.path)
                            ? 'bg-green-50 text-green-700'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-green-600' : 'text-gray-400'}`} />
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 w-full transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default UserSidebar;
