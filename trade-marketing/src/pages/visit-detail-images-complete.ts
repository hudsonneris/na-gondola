// 🔥 No visit-detail.tsx, substitua a seção de imagens por esta:

{(visit.photo_before || visit.photo_after) && (
  <div className="mt-4 pt-4 border-t">
    <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Registro Fotográfico</h4>
    <div className="grid grid-cols-2 gap-4">
      {visit.photo_before && (
        <div className="relative group">
          <p className="text-xs text-muted-foreground mb-1">ANTES</p>
          <div className="relative overflow-hidden rounded border group">
            <img 
              src={visit.photo_before}
              alt="Antes" 
              className="w-full max-h-48 object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
              onClick={() => window.open(visit.photo_before, '_blank')}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5Ij5TZW0gZm90bzwvdGV4dD48L3N2Zz4='
              }}
            />
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                className="bg-black/50 text-white px-2 py-1 rounded hover:bg-black/70 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(visit.photo_before, '_blank');
                }}
              >
                🔍 Zoom
              </button>
              <button 
                className="bg-black/50 text-white px-2 py-1 rounded hover:bg-black/70 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = visit.photo_before;
                  link.download = `antes_${visit.store_name || 'visita'}_${new Date().toISOString().slice(0,10)}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      )}
      {visit.photo_after && (
        <div className="relative group">
          <p className="text-xs text-muted-foreground mb-1">DEPOIS</p>
          <div className="relative overflow-hidden rounded border group">
            <img 
              src={visit.photo_after}
              alt="Depois" 
              className="w-full max-h-48 object-cover cursor-zoom-in transition-transform duration-300 hover:scale-105"
              onClick={() => window.open(visit.photo_after, '_blank')}
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5Ij5TZW0gZm90bzwvdGV4dD48L3N2Zz4='
              }}
            />
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
              <button 
                className="bg-black/50 text-white px-2 py-1 rounded hover:bg-black/70 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(visit.photo_after, '_blank');
                }}
              >
                🔍 Zoom
              </button>
              <button 
                className="bg-black/50 text-white px-2 py-1 rounded hover:bg-black/70 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement('a');
                  link.href = visit.photo_after;
                  link.download = `depois_${visit.store_name || 'visita'}_${new Date().toISOString().slice(0,10)}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                ⬇️ Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}
