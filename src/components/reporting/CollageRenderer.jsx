import React from 'react';

export default function CollageRenderer({ photos, layout, isPrint }) {
  if (!photos || photos.length < 2) return null;
  const gap = 'gap-1.5';

  // Strip: horizontal row
  if (layout === 'strip') {
    return (
      <div className={`flex ${gap} rounded-lg overflow-hidden shadow-md`}>
        {photos.map((url, i) => (
          <div key={i} className="flex-1 min-w-0">
            <img src={url} alt="" className="w-full h-full object-cover" style={{ aspectRatio: '1', maxHeight: isPrint ? '180px' : '260px' }} />
          </div>
        ))}
      </div>
    );
  }

  // Featured: one large on top, row of thumbnails below
  if (layout === 'featured' && photos.length >= 2) {
    const thumbs = photos.slice(1, 5);
    return (
      <div className={`rounded-lg overflow-hidden shadow-md flex flex-col ${gap}`}>
        <div className="w-full">
          <img src={photos[0]} alt="" className="w-full object-cover" style={{ maxHeight: isPrint ? '240px' : '340px' }} />
        </div>
        {thumbs.length > 0 && (
          <div className={`flex ${gap}`}>
            {thumbs.map((url, i) => (
              <div key={i} className="flex-1 min-w-0">
                <img src={url} alt="" className="w-full object-cover" style={{ aspectRatio: '1.5', maxHeight: isPrint ? '100px' : '140px' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mosaic: first photo large (left, spanning 2 rows), rest in grid
  if (layout === 'mosaic' && photos.length >= 3) {
    const rest = photos.slice(1, 5);
    return (
      <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="row-span-2">
          <img src={photos[0]} alt="" className="w-full h-full object-cover" style={{ maxHeight: isPrint ? '380px' : '420px' }} />
        </div>
        {rest.map((url, i) => (
          <div key={i}>
            <img src={url} alt="" className="w-full h-full object-cover" style={{ aspectRatio: '1.3', maxHeight: isPrint ? '190px' : '210px' }} />
          </div>
        ))}
      </div>
    );
  }

  // Default: Grid
  const cols = photos.length <= 2 ? 2 : photos.length <= 4 ? 2 : 3;
  return (
    <div className={`grid ${gap} rounded-lg overflow-hidden shadow-md`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {photos.map((url, i) => (
        <div key={i}>
          <img src={url} alt="" className="w-full object-cover" style={{ aspectRatio: cols === 2 ? '1.5' : '1.3', maxHeight: isPrint ? '180px' : '240px' }} />
        </div>
      ))}
    </div>
  );
}