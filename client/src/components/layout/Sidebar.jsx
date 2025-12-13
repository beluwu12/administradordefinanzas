import React from 'react';
import { NavLink } from 'react-router-dom';
import { texts } from '../../i18n/es';

const Sidebar = ({ navItems }) => {
    return (
        <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-[#ffffff10] fixed inset-y-0 left-0 z-50">
            <div className="h-16 flex items-center px-6 border-b border-[#ffffff10]">
                <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-background font-bold mr-3">
                    AF
                </div>
                <span className="font-bold text-lg text-text tracking-tight">{texts.app.name}</span>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium
                            ${isActive
                                ? 'bg-primary/15 text-primary'
                                : 'text-textSecondary hover:bg-surface hover:text-text'
                            }
                        `}
                    >
                        <item.icon size={22} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 text-xs text-textSecondary text-center opacity-50">
                v2.0.0
            </div>
        </aside>
    );
};

export default Sidebar;
