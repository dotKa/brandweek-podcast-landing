<script>
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  let { data, form } = $props();
  
  let session = $state(data.session ? { 
    ...data.session,
    day: String(data.session.day) || '1'
  } : {
    day: '1',
    title: '',
    duration: 0,
    date: '',
    audioUrl: '',
    summary: '',
    active: true,
    order: 0
  });
  
  let isNew = data.isNew;
  let uploading = $state(false);
  let uploadProgress = $state(0);
  let uploadError = $state('');
  
  $effect(() => {
    if (form?.success) {
      goto('/admin/sessions');
    }
  });
  
  /**
   * Dosyayı 5 MB'lık chunklara böl (S3 minimum part size)
   */
  function splitFileIntoChunks(file, chunkSize = 5 * 1024 * 1024) {
    const chunks = [];
    let offset = 0;
    let chunkNumber = 1;
    
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + chunkSize);
      chunks.push({ chunk, chunkNumber });
      offset += chunkSize;
      chunkNumber++;
    }
    
    return chunks;
  }
  
  /**
   * Chunk'ı base64'e çevir
   */
  function chunkToBase64(chunk) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (!result || typeof result !== 'string') {
          reject(new Error('Chunk okunamadı'));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Chunk okuma hatası'));
      reader.readAsDataURL(chunk);
    });
  }
  
  /**
   * @param {Event} event
   */
  async function handleFileUpload(event) {
    const target = /** @type {HTMLInputElement} */ (event.target);
    const file = target?.files?.[0];
    if (!file) return;
    
    uploading = true;
    uploadError = '';
    uploadProgress = 0;
    
    try {
      // MIME type'ı belirle
      const mimeType = file.type || 'audio/mpeg';
      
      // Dosya adını oluştur
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'mp3';
      const fileName = `session-${timestamp}.${fileExtension}`;
      
      const MIN_CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB (S3 minimum part size)
      
      // Eğer dosya 5 MB'dan küçükse, normal upload kullan
      if (file.size < MIN_CHUNK_SIZE) {
        uploadProgress = 10;
        
        // Dosyayı base64'e çevir
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result;
            if (!result || typeof result !== 'string') {
              reject(new Error('Dosya okunamadı'));
              return;
            }
            resolve(result);
          };
          reader.onerror = () => reject(new Error('Dosya okuma hatası'));
          reader.readAsDataURL(file);
        });
        
        uploadProgress = 30;
        
        // Normal upload endpoint'ine gönder
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            base64Data,
            mimeType,
            fileName
          })
        });
        
        uploadProgress = 90;
        
        if (!response.ok) {
          let errorMessage = 'Upload başarısız';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (!result.url) {
          throw new Error('Upload başarılı ancak URL alınamadı');
        }
        
        session.audioUrl = result.url;
        uploadProgress = 100;
        
        // Progress'i sıfırla
        setTimeout(() => {
          uploading = false;
          uploadProgress = 0;
        }, 2000);
        
        return;
      }
      
      // Büyük dosyalar için multipart upload
      // Dosyayı chunklara böl (S3 minimum part size: 5 MB)
      const chunks = splitFileIntoChunks(file, MIN_CHUNK_SIZE);
      const totalChunks = chunks.length;
      
      console.log(`[Upload] Dosya ${chunks.length} chunk'a bölündü (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      
      // 1. Multipart upload başlat
      uploadProgress = 5;
      const initResponse = await fetch('/api/upload/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName,
          mimeType
        })
      });
      
      if (!initResponse.ok) {
        let errorMessage = 'Upload başlatılamadı';
        try {
          const errorData = await initResponse.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${initResponse.status}: ${initResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const { uploadId } = await initResponse.json();
      uploadProgress = 10;
      
      // 2. Her chunk'ı sırayla yükle
      const parts = [];
      for (let i = 0; i < chunks.length; i++) {
        const { chunk, chunkNumber } = chunks[i];
        
        // Chunk'ı base64'e çevir
        const chunkBase64 = await chunkToBase64(chunk);
        
        // Chunk'ı yükle
        const chunkResponse = await fetch('/api/upload/chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            uploadId,
            partNumber: chunkNumber,
            chunkBase64,
            fileName
          })
        });
        
        if (!chunkResponse.ok) {
          let errorMessage = `Chunk ${chunkNumber} yüklenemedi`;
          try {
            const errorData = await chunkResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            errorMessage = `HTTP ${chunkResponse.status}: ${chunkResponse.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const { etag } = await chunkResponse.json();
        parts.push({ etag, partNumber: chunkNumber });
        
        // Progress'i güncelle (10% init, 85% chunks, 5% complete)
        const chunkProgress = 10 + ((i + 1) / totalChunks) * 85;
        uploadProgress = Math.min(chunkProgress, 95);
        
        console.log(`[Upload] Chunk ${chunkNumber}/${totalChunks} yüklendi (${uploadProgress.toFixed(1)}%)`);
      }
      
      // 3. Upload'ı tamamla
      uploadProgress = 98;
      const completeResponse = await fetch('/api/upload/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uploadId,
          parts,
          fileName
        })
      });
      
      if (!completeResponse.ok) {
        let errorMessage = 'Upload tamamlanamadı';
        try {
          const errorData = await completeResponse.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${completeResponse.status}: ${completeResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const result = await completeResponse.json();
      
      if (!result.url) {
        throw new Error('Upload başarılı ancak URL alınamadı');
      }
      
      session.audioUrl = result.url;
      uploadProgress = 100;
      
      // Progress'i sıfırla
      setTimeout(() => {
        uploading = false;
        uploadProgress = 0;
      }, 2000);
    } catch (err) {
      uploading = false;
      uploadProgress = 0;
      uploadError = err instanceof Error ? err.message : 'Dosya yüklenirken hata oluştu';
      console.error('Upload error:', err);
    }
  }
</script>

<svelte:head>
  <title>{isNew ? 'Yeni Session' : 'Session Düzenle'} - Admin</title>
</svelte:head>

<div class="admin-container">
  <div class="header-bar">
    <button class="back-btn" onclick={() => goto('/admin/sessions')}>← Geri</button>
    <h1>{isNew ? 'Yeni Session' : 'Session Düzenle'}</h1>
  </div>
  
  {#if form?.error}
    <div class="error-alert">
      <span class="error-icon">⚠️</span>
      <span>{form.error}</span>
    </div>
  {/if}
  
  <form method="POST" action="?/save" use:enhance class="session-form">
    <div class="form-section">
      <h2 class="section-title">Temel Bilgiler</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="day">Gün *</label>
          <select id="day" name="day" bind:value={session.day} required>
            <option value="1">1. Gün</option>
            <option value="2">2. Gün</option>
            <option value="3">3. Gün</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="order">Sıra</label>
          <input 
            type="number" 
            id="order" 
            name="order" 
            bind:value={session.order}
            min="0"
          />
        </div>
      </div>
      
      <div class="form-group">
        <label for="title">Başlık *</label>
        <input 
          type="text" 
          id="title" 
          name="title" 
          bind:value={session.title}
          placeholder="Session başlığını girin"
          required 
        />
      </div>
      
      <div class="form-grid">
        <div class="form-group">
          <label for="duration">Süre (dakika)</label>
          <input 
            type="number" 
            id="duration" 
            name="duration" 
            bind:value={session.duration}
            min="0"
            placeholder="0"
          />
        </div>
        
        <div class="form-group">
          <label for="date">Tarih</label>
          <input 
            type="text" 
            id="date" 
            name="date" 
            bind:value={session.date}
            placeholder="12 Kasım, 2025"
          />
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <h2 class="section-title">İçerik</h2>
      <div class="form-group">
        <label for="audioFile">Audio Dosyası</label>
        <input 
          type="file" 
          id="audioFile" 
          accept="audio/*"
          onchange={handleFileUpload}
          class="file-input"
        />
        {#if uploading}
          <div class="upload-status">Yükleniyor... {uploadProgress}%</div>
        {/if}
        {#if uploadError}
          <div class="upload-error">{uploadError}</div>
        {/if}
      </div>
      <div class="form-group">
        <label for="audioUrl">Audio URL (veya yukarıdan dosya yükleyin)</label>
        <input 
          type="url" 
          id="audioUrl" 
          name="audioUrl" 
          bind:value={session.audioUrl}
          placeholder="https://example.com/audio.mp3"
        />
      </div>
      
      <div class="form-group">
        <label for="summary">Özet</label>
        <textarea 
          id="summary" 
          name="summary" 
          bind:value={session.summary}
          rows="5"
          placeholder="Session özetini buraya yazın..."
        ></textarea>
      </div>
    </div>
    
    <div class="form-section">
      <h2 class="section-title">Durum</h2>
      <div class="checkbox-group">
        <label>
          <input 
            type="checkbox" 
            name="active" 
            checked={session.active}
          />
          <span>Yayında</span>
        </label>
      </div>
    </div>
    
    <div class="form-actions">
      <button type="button" class="cancel-btn" onclick={() => goto('/admin/sessions')}>İptal</button>
      <button type="submit" class="save-btn">Kaydet</button>
    </div>
  </form>
</div>

<style>
  .admin-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem;
    min-height: 100vh;
    background: #f5f6fb;
  }
  
  .header-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .back-btn {
    padding: 0.5rem 1rem;
    background: white;
    color: #1a1a1a;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .back-btn:hover {
    background: #f5f5f5;
    border-color: #d0d0d0;
  }
  
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .error-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #ffebee;
    color: #c62828;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    border-left: 3px solid #c62828;
    font-size: 13px;
  }
  
  .error-icon {
    font-size: 16px;
  }
  
  .session-form {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid #e0e0e0;
  }
  
  .form-section {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .form-section:last-of-type {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  .section-title {
    margin: 0 0 1rem 0;
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
  }
  
  input[type="text"],
  input[type="number"],
  input[type="url"],
  select,
  textarea {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
    background: white;
    box-sizing: border-box;
  }
  
  input:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: #4a63ff;
    box-shadow: 0 0 0 2px rgba(74, 99, 255, 0.1);
  }
  
  input::placeholder,
  textarea::placeholder {
    color: #a1a1a1;
  }
  
  textarea {
    resize: vertical;
    min-height: 80px;
    font-family: inherit;
  }
  
  .file-input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    background: white;
  }
  
  .file-input:hover {
    border-color: #4a63ff;
  }
  
  .upload-status {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #e3f2fd;
    color: #1976d2;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
  }
  
  .upload-error {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #ffebee;
    color: #c62828;
    border-radius: 6px;
    font-size: 13px;
  }
  
  .checkbox-group {
    margin-top: 0.5rem;
  }
  
  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    cursor: pointer;
    font-weight: 500;
  }
  
  .checkbox-group input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: #4a63ff;
  }
  
  .form-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #e0e0e0;
  }
  
  .save-btn,
  .cancel-btn {
    flex: 1;
    padding: 0.75rem 1.25rem;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .save-btn {
    background: #4a63ff;
    color: white;
  }
  
  .save-btn:hover {
    background: #3a53ef;
  }
  
  .cancel-btn {
    background: white;
    color: #1a1a1a;
    border: 1px solid #e0e0e0;
  }
  
  .cancel-btn:hover {
    background: #f5f5f5;
    border-color: #d0d0d0;
  }
  
  @media (max-width: 768px) {
    .admin-container {
      padding: 1rem;
    }
    
    .session-form {
      padding: 1rem;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .header-bar {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .back-btn {
      width: 100%;
    }
    
    .form-actions {
      flex-direction: column;
    }
  }
</style>

