// 🔥 Substitua a função handleUpload por esta:

const handleUpload = async (file: File, type: 'before' | 'after') => {
  if (!form.getValues('storeId')) {
    toast({ variant: "destructive", description: "Selecione uma loja primeiro" });
    return;
  }

  const setUploading = type === 'before' ? setUploadingBefore : setUploadingAfter;
  const setPhoto = type === 'before' ? setPhotoBefore : setPhotoAfter;
  const fieldName = type === 'before' ? 'photoBefore' : 'photoAfter';

  setUploading(true);
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    formData.append('storeId', String(form.getValues('storeId')));
    // 🔥 Adicionar promoterName (pode ser fixo ou vindo de um contexto)
    formData.append('promoterName', 'Promotor');

    const response = await fetch('/api/upload/visit-photo', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      // 🔥 USAR A URL DA IMAGEM COM METADADOS (data.url)
      setPhoto(data.url);
      form.setValue(fieldName, data.url);
      toast({ description: `Foto ${type === 'before' ? 'ANTES' : 'DEPOIS'} enviada!` });
    } else {
      toast({ variant: "destructive", description: "Erro ao enviar foto" });
    }
  } catch (error) {
    toast({ variant: "destructive", description: "Erro ao enviar foto" });
  } finally {
    setUploading(false);
  }
};
