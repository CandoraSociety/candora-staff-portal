import React from 'react';

export default function CollageRenderer({ photos, layout, isPrint }) {
  if (!photos || photos.length < 2) return null;
  const gap = 'gap-1.5';

  // ── Strip: staggered horizontal row with varied heights ──
  if (layout === 'strip') {
    const heights = ['80%', '100%', '65%', '90%', '75%', '95%'];
    return (
      <div className={`flex ${gap} rounded-lg overflow-hidden shadow-md items-end`} style={{ height: isPrint ? '220px' : '300px' }}>
        {photos.slice(0, 6).map((url, i) => (
          <div key={i} className="flex-1 min-w-0" style={{ height: heights[i % heights.length] }}>
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
    );
  }

  // ── Featured: hero photo on left, stacked smaller photos on right ──
  if (layout === 'featured' && photos.length >= 2) {
    const side = photos.slice(1, 4);
    return (
      <div className={`flex ${gap} rounded-lg overflow-hidden shadow-md`} style={{ height: isPrint ? '340px' : '440px' }}>
        <div className="flex-1 min-w-0">
          <img src={photos[0]} alt="" className="w-full h-full object-cover" />
        </div>
        <div className={`flex flex-col ${gap}`} style={{ width: '36%' }}>
          {side.map((url, i) => (
            <div key={i} className="flex-1 min-h-0">
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Mosaic: magazine-style asymmetric grid ──
  if (layout === 'mosaic' && photos.length >= 3) {
    const h = isPrint ? '340px' : '440px';
    if (photos.length === 3) {
      return (
        <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', height: h }}>
          <div className="row-span-2"><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>
          <div><img src={photos[1]} alt="" className="w-full h-full object-cover" /></div>
          <div><img src={photos[2]} alt="" className="w-full h-full object-cover" /></div>
        </div>
      );
    }
    if (photos.length === 4) {
      return (
        <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', height: h }}>
          <div className="row-span-2"><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>
          <div className="col-span-2"><img src={photos[1]} alt="" className="w-full h-full object-cover" /></div>
          <div><img src={photos[2]} alt="" className="w-full h-full object-cover" /></div>
          <div><img src={photos[3]} alt="" className="w-full h-full object-cover" /></div>
        </div>
      );
    }
    // 5+ photos: hero left, 2x2 grid right
    const rest = photos.slice(1, 5);
    return (
      <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '1fr 1fr', height: h }}>
        <div className="row-span-2"><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>
        {rest.map((url, i) => (
          <div key={i}><img src={url} alt="" className="w-full h-full object-cover" /></div>
        ))}
      </div>
    );
  }

  // ── Grid: dynamic with varied cell sizes ──
  if (photos.length === 2) {
    return (
      <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: '3fr 2fr', height: isPrint ? '200px' : '280px' }}>
        <div><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>
        <div><img src={photos[1]} alt="" className="w-full h-full object-cover" /></div>
      </div>
    );
  }
  if (photos.length === 3) {
    return (
      <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1fr 1fr', height: isPrint ? '280px' : '360px' }}>
        <div className="row-span-2"><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>
        <div><img src={photos[1]} alt="" className="w-full h-full object-cover" /></div>
        <div><img src={photos[2]} alt="" className="w-full h-full object-cover" /></div>
      </div>
    );
  }
  if (photos.length === 4) {
    return (
      <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: '2fr 1fr', height: isPrint ? '300px' : '380px' }}>
        <div className="col-span-2"><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>
        <div><img src={photos[1]} alt="" className="w-full h-full object-cover" /></div>
        <div><img src={photos[2]} alt="" className="w-full h-full object-cover" /></div>
      </div>
    );
  }
  // 5+ photos: hero spanning 2x2, rest filling around
  return (
    <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '1fr 1fr', height: isPrint ? '340px' : '440px' }}>
      <div className="col-span-2 row-span-2"><img src={photos[0]} alt="" className="w-full h-full object-cover" /></div>
      {photos.slice(1, 5).map((url, i) => (
        <div key={i}><img src={url} alt="" className="w-full h-full object-cover" /></div>
      ))}
    </div>
  );
}