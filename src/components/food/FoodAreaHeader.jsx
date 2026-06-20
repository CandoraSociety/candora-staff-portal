import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// Tab configurations per area
const AREA_TABS = {
  catering: {
    label: 'Catering',
    tabs: [
      { label: 'Quotes & Bookings', path: '/food/catering' },
      { label: 'Customers', path: '/food/customers' },
    ],
  },
  'cafe-candeur': {
    label: 'Cafe Candeur',
    tabs: [
      { label: 'Overview', path: '/food/cafe-candeur' },
      { label: 'Menu', path: '/food/cafe-candeur/menu' },
      { label: 'Orders', path: '/food/cafe-candeur/orders' },
      { label: 'Recipes', path: '/food/cafe-candeur/recipes' },
    ],
  },
  'auntie-bevs': {
    label: "Auntie Bev's",
    tabs: [
      { label: 'Overview', path: '/food/auntie-bevs' },
      { label: 'Menu', path: '/food/auntie-bevs/menu' },
      { label: 'Orders', path: '/food/auntie-bevs/orders' },
      { label: 'Recipes', path: '/food/auntie-bevs/recipes' },
    ],
  },
  'community-lunch': {
    label: 'Community Lunch',
    tabs: [
      { label: 'Overview', path: '/food/community-lunch' },
      { label: 'Orders', path: '/food/community-lunch/orders' },
      { label: 'Inventory', path: '/food/inventory' },
    ],
  },
  sales: {
    label: 'Sales',
    tabs: [
      { label: 'Overview', path: '/food/sales' },
    ],
  },
};

export default function FoodAreaHeader({ area }) {
  const location = useLocation();
  const config = AREA_TABS[area];
  if (!config) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="border-b bg-background px-6 pt-5 pb-0">
      <h1 className="text-xl font-bold mb-3">{config.label}</h1>
      <div className="flex gap-1 overflow-x-auto">
        {config.tabs.map(({ label, path }) => (
          <Link
            key={path}
            to={path}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              isActive(path)
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}