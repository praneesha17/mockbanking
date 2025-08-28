import React from 'react';
import { Home, DollarSign, Send, History, Eye } from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange }) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview of your account'
    },
    {
      id: 'balance',
      label: 'View Balance',
      icon: Eye,
      description: 'Check your current account balance'
    },
    {
      id: 'transfer',
      label: 'Transfer Money',
      icon: Send,
      description: 'Send money to another account'
    },
    {
      id: 'transactions',
      label: 'Transaction History',
      icon: History,
      description: 'View your recent transactions'
    }
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r h-full min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">Quick Actions</h2>
        <nav className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-start space-x-3 px-4 py-4 rounded-lg transition-all duration-200 text-left group ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <div className={`p-1 rounded ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${
                    isActive ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {item.label}
                  </p>
                  <p className={`text-xs truncate ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <div className="w-1 h-8 bg-blue-600 rounded-full ml-2"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;