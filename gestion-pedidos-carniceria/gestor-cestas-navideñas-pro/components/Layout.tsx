import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION_ITEMS, APP_TITLE } from '../constants';
import { Bars3Icon, XMarkIcon } from './icons/HeroIcons';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Sidebar */}
      <aside className={`bg-neutral-900 text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30`}>
        <div className="px-4 flex items-center justify-between">
          <NavLink to="/" className="flex items-center space-x-2 text-white text-2xl font-semibold hover:text-primary-light">
            <img src="/EMB.jpg" alt="Logo" className="h-8 w-8 rounded-full object-cover" />
            <span>
              {APP_TITLE.split(' ')[0]} <span className="text-primary-DEFAULT">{APP_TITLE.split(' ').slice(1).join(' ')}</span>
            </span>
          </NavLink>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white hover:text-primary-light">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav>
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 group py-2.5 px-4 rounded transition duration-200 hover:bg-neutral-700 hover:text-white ${
                  isActive ? 'bg-primary-dark text-white' : 'text-neutral-300'
                }`
              }
            >
              <item.icon className="h-5 w-5 text-neutral-400 group-hover:text-white" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm flex items-center justify-between md:justify-end p-4">
          <button onClick={() => setSidebarOpen(true)} className="text-neutral-700 md:hidden">
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-4">
            {/* Usuario de demostración */}
            <span className="text-neutral-700">Usuario de demostración</span>
            <div className="w-10 h-10 rounded-full bg-primary-DEFAULT flex items-center justify-center text-white font-semibold">
              UD
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral-100 p-6">
          {children}
        </main>
        
        {/* Watermark */}
        <div className="fixed bottom-3 right-4 text-sm text-neutral-400 z-10 select-none pointer-events-none">
          Desarrollado por JCF2025DV
        </div>
      </div>
    </div>
  );
};

export default Layout;
