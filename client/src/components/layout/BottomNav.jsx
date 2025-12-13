import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ArrowRightLeft, PieChart, Target, User } from 'lucide-react';
import { texts } from '../../i18n/es';

const BottomNav = ({ navItems }) => {
    const location = useLocation();

    // Use passed navItems or fallback to empty array
    const items = navItems || [];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-border z-40 pb-safe animate-in slide-in-from-bottom-full duration-500">
            <div className="flex justify-around items-center h-16">
                {items.map((item) => {
                    // Check if item has 'to' or 'path' property to support both structures
                    const path = item.to || item.path;
                    const Icon = item.icon;
                    const isActive = location.pathname === path;

                    return (
                        <NavLink
                            key={path}
                            to={path}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${isActive
                                    ? 'text-primary'
                                    : 'text-muted hover:text-text'
                                }`}
                        >
                            <Icon
                                size={24}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                            />
                            <span className="text-[10px] font-medium leading-none">
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNav;
