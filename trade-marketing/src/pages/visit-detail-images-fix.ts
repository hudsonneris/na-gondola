// 🔥 Substitua a seção de imagens por esta:

{(visit.photo_before || visit.photo_after) && (
  <div className="mt-4 pt-4 border-t">
    <h4 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Registro Fotográfico</h4>
    <div className="grid grid-cols-2 gap-4">
      {visit.photo_before && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">ANTES</p>
          <img 
            src={`/uploads/${visit.photo_before.split('/').pop()}`}
            alt="Antes" 
            className="w-full max-h-48 object-cover rounded border"
            onError={(e) => {
              console.error('Erro ao carregar imagem:', e.target.src);
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5Ij5TZW0gZm90bzwvdGV4dD48L3N2Zz4='
            }}
          />
        </div>
      )}
      {visit.photo_after && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">DEPOIS</p>
          <img 
            src={`/uploads/${visit.photo_after.split('/').pop()}`}
            alt="Depois" 
            className="w-full max-h-48 object-cover rounded border"
            onError={(e) => {
              console.error('Erro ao carregar imagem:', e.target.src);
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSIxMDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5Ij5TZW0gZm90bzwvdGV4dD48L3N2Zz4='
            }}
          />
        </div>
      )}
    </div>
  </div>
)}
