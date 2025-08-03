'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed w-full z-10">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left side: Logo & Menu Button */}
        <div className="flex items-center">
          <button 
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center space-x-2 ml-2">
            <Image 
              src="/images/insureme-logo-pwsimg-849.jpg" 
              alt="InsureMe Insurance Brokerage" 
              width={40} 
              height={40} 
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-800">InsureMe Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
} 
