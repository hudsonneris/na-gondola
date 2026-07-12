// 🔥 Substitua a função onSubmit no visit-new.tsx por esta:

const onSubmit = async (data: VisitFormValues) => {
  const formattedData = {
    storeId: data.storeId,
    visitedAt: data.visitedAt,
    notes: data.notes || null,
    checkIn: data.checkIn || null,
    checkOut: data.checkOut || null,
    status: "completed",
    photoBefore: data.photoBefore || null,
    photoAfter: data.photoAfter || null,
    items: data.items.map(item => ({
      productId: item.productId,
      inStock: item.inStock,
      price: item.price ? Number(item.price) : null,
      notes: item.notes || null,
      supplyStatus: item.supplyStatus || [],
    })),
  };

  try {
    let url;
    let method;
    
    if (draftId) {
      url = `http://localhost:3000/api/visits/${draftId}`;
      method = 'PUT';
    } else {
      url = 'http://localhost:3000/api/visits';
      method = 'POST';
    }

    console.log(`📡 ${method} ${url}`, formattedData);

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formattedData),
    });

    if (response.ok) {
      const result = await response.json();
      sessionStorage.removeItem('currentDraftId');
      queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetRecentVisitsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      toast({ description: "Visita registrada com sucesso!" });
      setLocation(`/visits/${result.id}`);
    } else {
      const error = await response.text();
      console.error("Erro ao finalizar visita:", error);
      toast({ variant: "destructive", description: "Falha ao registrar visita" });
    }
  } catch (error) {
    console.error("Erro ao finalizar visita:", error);
    toast({ variant: "destructive", description: "Falha ao registrar visita" });
  }
};
