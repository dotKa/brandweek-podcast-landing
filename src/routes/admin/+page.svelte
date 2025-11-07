<script>
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  
  let { form } = $props();
  
  let username = '';
  let password = '';
  let error = '';
  
  $effect(() => {
    if (form?.success) {
      goto('/admin/sessions');
    }
    if (form?.error) {
      error = form.error;
    }
  });
</script>

<svelte:head>
  <title>Admin Login - Brand Week</title>
</svelte:head>

<div class="login-container">
  <div class="login-box">
    <div class="login-header">
      <h1>Admin Girişi</h1>
      <p class="login-subtitle">Brand Week Yönetim Paneli</p>
    </div>
    {#if error}
      <div class="error-alert">
        <span class="error-icon">⚠️</span>
        <span>{error}</span>
      </div>
    {/if}
    <form method="POST" use:enhance class="login-form">
      <div class="form-group">
        <label for="username">Kullanıcı Adı</label>
        <input 
          type="text" 
          id="username" 
          name="username" 
          bind:value={username}
          placeholder="Kullanıcı adınızı girin"
          required 
        />
      </div>
      <div class="form-group">
        <label for="password">Şifre</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          bind:value={password}
          placeholder="Şifrenizi girin"
          required 
        />
      </div>
      <button type="submit" class="login-btn">
        <span>Giriş Yap</span>
        <span class="btn-arrow">→</span>
      </button>
    </form>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f6fb 0%, #e8eaf6 100%);
    padding: 2rem;
  }
  .login-box {
    background: white;
    padding: 3rem;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    width: 100%;
    max-width: 450px;
    border: 1px solid rgba(255,255,255,0.8);
  }
  .login-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }
  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 28px;
    font-weight: 600;
    color: #1a1a1a;
  }
  .login-subtitle {
    margin: 0;
    font-size: 14px;
    color: #757575;
    font-weight: 400;
  }
  .error-alert {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: #ffebee;
    color: #c62828;
    padding: 1rem 1.25rem;
    border-radius: 12px;
    margin-bottom: 1.5rem;
    border-left: 4px solid #c62828;
    font-size: 14px;
  }
  .error-icon {
    font-size: 20px;
  }
  .login-form {
    margin-top: 2rem;
  }
  .form-group {
    margin-bottom: 1.5rem;
  }
  label {
    display: block;
    margin-bottom: 0.625rem;
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
  }
  input {
    width: 100%;
    padding: 0.875rem 1rem;
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    font-size: 15px;
    font-family: inherit;
    transition: all 0.2s;
    background: white;
  }
  input:focus {
    outline: none;
    border-color: #4a63ff;
    box-shadow: 0 0 0 3px rgba(74, 99, 255, 0.1);
  }
  input::placeholder {
    color: #a1a1a1;
  }
  .login-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.5rem;
    background: #4a63ff;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(74, 99, 255, 0.3);
    margin-top: 0.5rem;
  }
  .login-btn:hover {
    background: #3a53ef;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(74, 99, 255, 0.4);
  }
  .btn-arrow {
    font-size: 18px;
    transition: transform 0.2s;
  }
  .login-btn:hover .btn-arrow {
    transform: translateX(4px);
  }
</style>

