<script>
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  let { data, form } = $props();
  
  let sessions = $state(data.sessions || []);
  let searchQuery = $state('');
  let filterDay = $state('all');
  let filterActive = $state('all');
  
  // Data değiştiğinde sessions'ı güncelle
  $effect(() => {
    if (data.sessions) {
      sessions = data.sessions;
    }
  });
  
  $effect(() => {
    if (form?.success) {
      // Sayfayı yenile
      window.location.reload();
    }
  });
  
  function handleEdit(id) {
    goto(`/admin/sessions/${id}`);
  }
  
  function handleCreate() {
    goto('/admin/sessions/new');
  }
  
  let filteredSessions = $derived.by(() => {
    let result = [...sessions];
    
    // Arama filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title?.toLowerCase().includes(query) ||
        s.summary?.toLowerCase().includes(query) ||
        String(s.id).includes(query) ||
        String(s.order).includes(query)
      );
    }
    
    // Gün filtresi
    if (filterDay !== 'all') {
      result = result.filter(s => s.day === Number(filterDay));
    }
    
    // Aktif/Pasif filtresi
    if (filterActive !== 'all') {
      const isActive = filterActive === 'active';
      result = result.filter(s => s.active === isActive);
    }
    
    return result;
  });
  
  function clearFilters() {
    searchQuery = '';
    filterDay = 'all';
    filterActive = 'all';
  }
</script>

<svelte:head>
  <title>Session Yönetimi - Admin</title>
</svelte:head>

<div class="admin-container">
  <div class="header">
    <div>
      <h1>Session Yönetimi</h1>
      <p class="subtitle">Toplam {sessions.length} session | Gösterilen: {filteredSessions.length}</p>
    </div>
    <button class="create-btn" onclick={handleCreate}>
      <span class="btn-icon">+</span>
      Yeni Session Ekle
    </button>
  </div>
  
  <div class="filters-bar">
    <div class="search-box">
      <input 
        type="text" 
        placeholder="Ara (başlık, özet, ID, sıra...)" 
        bind:value={searchQuery}
        class="search-input"
      />
      {#if searchQuery}
        <button class="clear-btn" onclick={() => searchQuery = ''}>×</button>
      {/if}
    </div>
    
    <div class="filters">
      <select bind:value={filterDay} class="filter-select">
        <option value="all">Tüm Günler</option>
        <option value="1">1. Gün</option>
        <option value="2">2. Gün</option>
        <option value="3">3. Gün</option>
      </select>
      
      <select bind:value={filterActive} class="filter-select">
        <option value="all">Tüm Durumlar</option>
        <option value="active">Aktif</option>
        <option value="inactive">Pasif</option>
      </select>
      
      {#if searchQuery || filterDay !== 'all' || filterActive !== 'all'}
        <button class="clear-filters-btn" onclick={clearFilters}>
          Filtreleri Temizle
        </button>
      {/if}
    </div>
  </div>
  
  <div class="sessions-list">
    {#if sessions.length === 0}
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>Henüz session eklenmemiş</h2>
        <p>İlk session'ınızı eklemek için yukarıdaki butona tıklayın.</p>
        <button class="create-btn" onclick={handleCreate}>Yeni Session Ekle</button>
      </div>
    {:else if filteredSessions.length === 0}
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h2>Sonuç bulunamadı</h2>
        <p>Arama kriterlerinize uygun session bulunamadı.</p>
        <button class="clear-filters-btn" onclick={clearFilters}>Filtreleri Temizle</button>
      </div>
    {:else}
      <div class="sessions-grid">
        {#each filteredSessions as session (session.id)}
          <div class="session-card">
            <div class="session-card-header">
              <div class="session-badge">#{session.order}</div>
              <div class="session-status">
                <span class="status-badge" class:active={session.active} class:inactive={!session.active}>
                  {session.active ? '✓ Aktif' : '○ Pasif'}
                </span>
              </div>
            </div>
            <div class="session-card-body">
              <h3 class="session-title">{session.title || 'Başlıksız Session'}</h3>
              <div class="session-meta">
                <span class="meta-item">
                  <span class="meta-label">Gün:</span>
                  <span class="meta-value">{session.day}. Gün</span>
                </span>
                <span class="meta-item">
                  <span class="meta-label">Süre:</span>
                  <span class="meta-value">{session.duration || 0} dk</span>
                </span>
              </div>
              {#if session.date}
                <div class="session-date">{session.date}</div>
              {/if}
              <div class="session-content-indicators">
                {#if session.audioUrl}
                  <span class="indicator audio">🎵 Audio</span>
                {/if}
                {#if session.summary}
                  <span class="indicator summary">📝 Özet</span>
                {/if}
                {#if !session.audioUrl && !session.summary}
                  <span class="indicator empty">⚠️ İçerik yok</span>
                {/if}
              </div>
            </div>
            <div class="session-card-actions">
              <button class="action-btn edit" onclick={() => handleEdit(session.id)}>
                Düzenle
              </button>
              <form method="POST" action="?/delete" use:enhance>
                <input type="hidden" name="id" value={session.id} />
                <button type="submit" class="action-btn delete">Sil</button>
              </form>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .admin-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
    background: #f5f6fb;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid #e0e0e0;
  }
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 32px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .subtitle {
    margin: 0;
    font-size: 14px;
    color: #a1a1a1;
    font-weight: 400;
  }
  .create-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.75rem;
    background: #4a63ff;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(74, 99, 255, 0.3);
  }
  .create-btn:hover {
    background: #3a53ef;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 99, 255, 0.4);
  }
  .btn-icon {
    font-size: 20px;
    line-height: 1;
  }
  .filters-bar {
    background: white;
    padding: 1.25rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    border: 1px solid #e0e0e0;
    margin-bottom: 1.5rem;
  }
  
  .search-box {
    position: relative;
    margin-bottom: 1rem;
  }
  
  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    padding-right: 2.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
    box-sizing: border-box;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #4a63ff;
    box-shadow: 0 0 0 2px rgba(74, 99, 255, 0.1);
  }
  
  .clear-btn {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: #e0e0e0;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    color: #757575;
    transition: all 0.2s;
  }
  
  .clear-btn:hover {
    background: #d0d0d0;
  }
  
  .filters {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  
  .filter-select {
    padding: 0.625rem 0.875rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .filter-select:focus {
    outline: none;
    border-color: #4a63ff;
    box-shadow: 0 0 0 2px rgba(74, 99, 255, 0.1);
  }
  
  .clear-filters-btn {
    padding: 0.625rem 1rem;
    background: #f5f5f5;
    color: #1a1a1a;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .clear-filters-btn:hover {
    background: #e0e0e0;
    border-color: #d0d0d0;
  }
  
  .sessions-list {
    margin-top: 0;
  }
  .sessions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
  }
  .session-card {
    background: white;
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: all 0.3s;
    border: 1px solid #e0e0e0;
  }
  .session-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }
  .session-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  .session-badge {
    background: #4a63ff;
    color: white;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 16px;
  }
  .status-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
  }
  .status-badge.active {
    background: #e8f5e9;
    color: #2e7d32;
  }
  .status-badge.inactive {
    background: #f5f5f5;
    color: #757575;
  }
  .session-card-body {
    margin-bottom: 1.5rem;
  }
  .session-title {
    margin: 0 0 1rem 0;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.4;
  }
  .session-meta {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 0.75rem;
    font-size: 14px;
  }
  .meta-item {
    display: flex;
    gap: 0.5rem;
  }
  .meta-label {
    color: #a1a1a1;
    font-weight: 400;
  }
  .meta-value {
    color: #1a1a1a;
    font-weight: 500;
  }
  .session-date {
    font-size: 13px;
    color: #757575;
    margin-bottom: 1rem;
  }
  .session-content-indicators {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }
  .indicator {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }
  .indicator.audio {
    background: #e3f2fd;
    color: #1976d2;
  }
  .indicator.summary {
    background: #f3e5f5;
    color: #7b1fa2;
  }
  .indicator.empty {
    background: #fff3e0;
    color: #e65100;
  }
  .session-card-actions {
    display: flex;
    gap: 0.75rem;
    padding-top: 1rem;
    border-top: 1px solid #e0e0e0;
  }
  .action-btn {
    flex: 1;
    padding: 0.625rem 1rem;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .action-btn.edit {
    background: #4a63ff;
    color: white;
  }
  .action-btn.edit:hover {
    background: #3a53ef;
  }
  .action-btn.delete {
    background: #ffebee;
    color: #c62828;
  }
  .action-btn.delete:hover {
    background: #ffcdd2;
  }
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }
  .empty-icon {
    font-size: 64px;
    margin-bottom: 1rem;
  }
  .empty-state h2 {
    margin: 0 0 0.5rem 0;
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .empty-state p {
    margin: 0 0 2rem 0;
    color: #757575;
    font-size: 15px;
  }
  @media (max-width: 768px) {
    .sessions-grid {
      grid-template-columns: 1fr;
    }
    .header {
      flex-direction: column;
      gap: 1rem;
    }
    .create-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>

