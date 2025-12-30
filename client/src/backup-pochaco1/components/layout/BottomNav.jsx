import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

/**
 * BottomNav - Based on mobile template concept
 * White background, pink active state
 */
const BottomNav = ({ navItems }) => {
    const location = useLocation();
    const items = navItems || [];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 pb-safe">
            <div className="flex justify-around items-center h-16">
                {items.slice(0, 5).map((item) => {
                    const path = item.to || item.path;
                    const isActive = location.pathname === path;

                    return (
                        <NavLink
                            key={path}
                            to={path}
                            className={`flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors ${isActive
                                    ? 'text-primary'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <span
                                className="material-symbols-outlined text-2xl mb-1"
                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                            >
                                {getIconName(path)}
                            </span>
                            <span className={`text-[10px] font-semibold ${isActive ? 'font-bold' : ''}`}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

const getIconName = (path) => {
    const icons = {
        '/': 'dashboard',
        '/transactions': 'receipt_long',
        '/tags': 'sell',
        '/budget': 'pie_chart',
        '/goals': 'savings',
    };
    return icons[path] || 'circle';
};

export default BottomNav;
