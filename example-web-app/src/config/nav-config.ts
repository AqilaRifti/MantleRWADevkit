import { NavItem } from '@/types';

/**
 * Navigation configuration for RWA Tokenization Platform
 * 
 * This configuration supports both investor and admin views
 */
export const navItems: NavItem[] = [
  {
    title: 'Property',
    url: '/property',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['p', 'p'],
    items: []
  },
  {
    title: 'Investor Portal',
    url: '/investor',
    icon: 'workspace',
    isActive: false,
    shortcut: ['i', 'i'],
    items: []
  },
  {
    title: 'Admin',
    url: '#',
    icon: 'product',
    isActive: true,
    items: [
      {
        title: 'Dashboard',
        url: '/admin',
        icon: 'dashboard',
        shortcut: ['a', 'd']
      },
      {
        title: 'Mint Tokens',
        url: '/admin/mint',
        icon: 'kanban',
        shortcut: ['a', 'm']
      },
      {
        title: 'Yield Distribution',
        url: '/admin/yield',
        icon: 'billing',
        shortcut: ['a', 'y']
      }
    ]
  }
];
