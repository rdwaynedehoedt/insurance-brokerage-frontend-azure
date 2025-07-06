'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  UserPlusIcon, 
  UsersIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  Cog6ToothIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

interface SidebarProps {
  navItems: NavItem[];
}

export default function Sidebar({ navItems }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  // Map icon strings to actual icon components
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'HomeIcon':
        return <HomeIcon className="w-6 h-6" />;
      case 'UserPlusIcon':
        return <UserPlusIcon className="w-6 h-6" />;
      case 'UsersIcon':
        return <UsersIcon className="w-6 h-6" />;
      case 'DocumentTextIcon':
        return <DocumentTextIcon className="w-6 h-6" />;
      case 'ChartBarIcon':
        return <ChartBarIcon className="w-6 h-6" />;
      case 'Cog6ToothIcon':
        return <Cog6ToothIcon className="w-6 h-6" />;
      default:
        return <HomeIcon className="w-6 h-6" />;
    }
  };

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } min-h-screen pt-16 fixed left-0 top-0 z-40`}
    >
      <div className="h-full px-3 py-4 overflow-y-auto">
        <button
          onClick={toggleSidebar}
          className="absolute right-0 top-20 bg-white border border-gray-200 rounded-l-md p-1 -mr-3 shadow-md"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-4 h-4" />
          ) : (
            <ChevronLeftIcon className="w-4 h-4" />
          )}
        </button>

        <ul className="space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center p-2 rounded-lg ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className="min-w-[24px]">{getIcon(item.icon)}</div>
                  {!collapsed && (
                    <span className="ml-3 whitespace-nowrap">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
} 