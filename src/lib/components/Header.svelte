<div class="header">
  <div class="logos">
    <img class="logo-brandweek" src="/assets/brandweek.png" alt="Brand Week" />
    <hr class="divider-vertical" />
    <img class="logo-gemini" src="/assets/gemini.png" alt="Gemini" />
  </div>
  <div class="title">Brand Week Oturum Özetleri</div>
  <div class="subtitle"><strong>Google Gemini ile Üretildi.</strong></div>
  <div class="description">
    Brand Week oturumlarını podcast olarak dinlemek ve özetlerini okumak için
    sayfaya göz at.
  </div>
</div>

<style>
  .header {
    text-align: center;
    padding: 40px 20px 20px;
  }
  .logos {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }
  .logo-brandweek {
    height: 10rem;
  }
  .logo-gemini {
    height: 4rem;
  }
  .divider-vertical {
    width: 1px;
    height: 7rem;
    background: transparent;
    margin: 0 12px;
    border: none;
    border-left: 3px solid #e0e0e0;
  }
  .title {
    font-weight: 500;
    font-size: 40px;
    color: #1a1a1a;
    line-height: 1.3;
  }
  @media (max-width: 768px) {
    .title {
      font-size: 20px;
    }
  }
  .subtitle {
    font-weight: 400;
    font-size: 25px;
    line-height: 25px;
    color: #1a1a1a;
    margin-top: 6px;
    margin-bottom: 12px;
  }
  @media (max-width: 768px) {
    .subtitle {
      font-size: 15px;
    }
  }
  .description {
    font-weight: 400;
    font-size: 24px;
    line-height: 25px;
    color: #a1a1a1;
    max-width: 720px;
    margin: 24px auto 0;
  }
  @media (max-width: 768px) {
    .description {
      font-size: 15px;
    }
  }
  @media (max-width: 768px) {
    .logo-brandweek {
      height: 5.375rem;
    }
    .logo-gemini {
      height: 2.125rem;
    }
    .divider-vertical {
      height: 3.75rem;
    }
    .description {
      max-width: 400px;
      margin: 0 auto;
    }
  }
</style>
