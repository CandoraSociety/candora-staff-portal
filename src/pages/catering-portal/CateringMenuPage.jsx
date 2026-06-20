import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

const CATEGORIES = ['appetizers','entrees','sides','desserts','beverages','platters'];
const DIETARY_COLORS = { vegan: 'bg-green-100 text-green-700', vegetarian: 'bg-emerald-100 text-emerald-700', 'gluten-free': 'bg-amber-100 text-amber-700', 'dairy-free': 'bg-blue-100 text-blue-700', 'gluten-free option': 'bg-yellow-100 text-yellow-600' };

export default function CateringMenuPage() {
  const [styleFilter, setStyleFilter] = useState('all');
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['public-catering-menu'],
    queryFn: () => base44.entities.CateringMenuItem.filter({ is_active: true }),
  });

  const filtered = styleFilter === 'all' ? items : items.filter(i => i.style === styleFilter);
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const catItems = filtered.filter(i => i.category === cat);
    if (catItems.length) acc[cat] = catItems;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold text-cp-text mb-3">Our Catering Menu</h1>
        <p className="text-gray-500">Fresh, seasonal dishes crafted for every style of event</p>
      </div>

      <div className="flex justify-center gap-3 mb-10">
        {['all','buffet','plated'].map(f => (
          <button key={f} onClick={() => setStyleFilter(f)}
            className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-colors border ${styleFilter === f ? 'bg-cp-primary text-white border-cp-primary' : 'border-cp-border text-gray-500 hover:border-cp-primary hover:text-cp-primary'}`}
          >
            {f === 'all' ? 'All Styles' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6).fill(0).map((_, i) => <div key={i} className="bg-cp-muted rounded-xl h-36 animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <h2 className="font-heading text-2xl font-bold capitalize mb-5 text-cp-text border-b border-cp-border pb-2">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {catItems.map(item => (
                  <div key={item.id} className="bg-white rounded-xl p-5 border border-cp-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-heading font-bold text-cp-text">{item.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${item.style === 'plated' ? 'bg-purple-100 text-purple-600' : 'bg-green-100 text-green-600'}`}>
                        {item.style}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 leading-relaxed">{item.description}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(item.dietary_tags || []).map(tag => (
                        <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIETARY_COLORS[tag] || 'bg-gray-100 text-gray-500'}`}>{tag}</span>
                      ))}
                    </div>
                    <p className="text-cp-primary font-semibold text-sm">
                      {item.price_per_person ? `$${item.price_per_person.toFixed(2)} / person` : item.price_per_unit ? `$${item.price_per_unit.toFixed(2)} / unit` : 'Price on request'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(grouped).length === 0 && (
            <div className="text-center py-16 text-gray-400">No menu items found for this style.</div>
          )}
        </div>
      )}

      <div className="mt-16 text-center bg-cp-muted rounded-2xl p-10">
        <h3 className="font-heading text-2xl font-bold mb-3 text-cp-text">Ready to Plan Your Menu?</h3>
        <p className="text-gray-500 mb-6">Build your perfect event menu when you submit a booking request.</p>
        <Link to="/catering-portal/book" className="bg-cp-primary text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity">
          Book an Event
        </Link>
      </div>
    </div>
  );
}