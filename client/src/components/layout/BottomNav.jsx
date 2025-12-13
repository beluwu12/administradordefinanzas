import React from 'react';
import { NavLink } from 'react-router-dom';

const BottomNav = ({ navItems }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-[#ffffff10] z-50 pb-safe">
            <div className="flex justify-around items-center h-16 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center w-full h-full gap-1 transition-colors
                            ${isActive ? 'text-primary' : 'text-textSecondary'}
                        `}
                    >
                        <item.icon size={24} strokeWidth={2} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
