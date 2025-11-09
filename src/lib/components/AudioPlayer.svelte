<script>
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { setActiveAudio, clearActiveAudio, activeAudioElement } from '$lib/stores/audioManager.js';
  
  let { audioUrl } = $props();
  
  let audioElement;
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let progressFillElement;
  let currentTimeText;
  let durationText;
  
  const dispatch = createEventDispatcher();
  
  // Diğer audio başlatıldığında bu audio'yu durdur
  let unsubscribe;
  let durationCheckInterval;
  
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  
  function updateDuration() {
    if (!audioElement) return;
    const newDuration = audioElement.duration;
    if (newDuration && !isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
      if (duration !== newDuration) {
        duration = newDuration;
        if (durationText) {
          durationText.textContent = formatTime(duration);
        }
        // Duration'ı parent component'e gönder (dakika cinsinden)
        const durationInMinutes = Math.round(duration / 60);
        dispatch('duration', durationInMinutes);
      }
    }
  }
  
  function togglePlay() {
    if (!audioElement) return;
    
    if (audioElement.paused) {
      // Diğer audio'ları durdur ve bu audio'yu aktif yap
      setActiveAudio(audioElement);
      audioElement.play();
      isPlaying = true;
      // Oynatma başladığında duration'ı tekrar kontrol et
      updateDuration();
    } else {
      audioElement.pause();
      isPlaying = false;
      clearActiveAudio(audioElement);
    }
  }
  
  function jumpBack() {
    if (!audioElement) return;
    audioElement.currentTime = Math.max(0, audioElement.currentTime - 10);
  }
  
  function jumpForward() {
    if (!audioElement) return;
    const maxTime = audioElement.duration || duration || 0;
    audioElement.currentTime = Math.min(maxTime, audioElement.currentTime + 10);
  }
  
  function handleProgressClick(e) {
    if (!audioElement) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    // audioElement.duration kullan (state'den daha güvenilir)
    const audioDuration = audioElement.duration || duration;
    if (audioDuration > 0 && !isNaN(audioDuration) && isFinite(audioDuration)) {
      audioElement.currentTime = percentage * audioDuration;
    }
  }
  
  function handleTimeUpdate() {
    if (!audioElement) return;
    currentTime = audioElement.currentTime;
    if (currentTimeText) {
      currentTimeText.textContent = formatTime(currentTime);
    }
    // Duration'ı periyodik olarak kontrol et (m4a dosyaları için)
    if (!duration || duration === 0) {
      updateDuration();
    }
    const audioDuration = audioElement.duration || duration;
    if (progressFillElement && audioDuration > 0) {
      const progress = (currentTime / audioDuration) * 100;
      progressFillElement.style.width = `${progress}%`;
    }
  }
  
  function handleLoadedMetadata() {
    updateDuration();
  }
  
  function handleDurationChange() {
    updateDuration();
  }
  
  function handleLoadedData() {
    updateDuration();
  }
  
  function handleCanPlay() {
    updateDuration();
  }
  
  onMount(() => {
    // audioElement bind edildikten sonra event listener'ları ekle
    const setupAudio = () => {
      if (!audioElement) return;
      
      // M4a dosyaları için tüm duration event'lerini dinle
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.addEventListener('durationchange', handleDurationChange);
      audioElement.addEventListener('loadeddata', handleLoadedData);
      audioElement.addEventListener('canplay', handleCanPlay);
      audioElement.addEventListener('pause', () => { 
        isPlaying = false;
        clearActiveAudio(audioElement);
      });
      audioElement.addEventListener('play', () => { 
        isPlaying = true;
        setActiveAudio(audioElement);
        // Oynatma başladığında duration'ı kontrol et
        updateDuration();
      });
      
      // M4a dosyaları için fallback: periyodik olarak duration kontrol et
      durationCheckInterval = setInterval(() => {
        if (audioElement && (!duration || duration === 0)) {
          updateDuration();
        }
      }, 500);
      
      // İlk yüklemede duration'ı kontrol et
      if (audioElement.readyState >= 1) {
        updateDuration();
      }
      
      // Diğer audio başlatıldığında bu audio'yu durdur
      unsubscribe = activeAudioElement.subscribe((activeAudio) => {
        if (activeAudio && activeAudio !== audioElement && audioElement && !audioElement.paused) {
          audioElement.pause();
          isPlaying = false;
        }
      });
    };
    
    // Hemen dene, yoksa bir sonraki tick'te dene
    if (audioElement) {
      setupAudio();
    } else {
      setTimeout(setupAudio, 0);
    }
  });
  
  onDestroy(() => {
    if (durationCheckInterval) {
      clearInterval(durationCheckInterval);
    }
    if (audioElement) {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('durationchange', handleDurationChange);
      audioElement.removeEventListener('loadeddata', handleLoadedData);
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.pause();
      clearActiveAudio(audioElement);
    }
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

  <div class="player">
  <audio bind:this={audioElement} src={audioUrl} preload="metadata"></audio>
  <div class="progress-bar" on:click={handleProgressClick}>
    <div class="progress-fill" bind:this={progressFillElement}></div>
  </div>
  <div class="player-times">
    <span bind:this={currentTimeText}>00:00</span>
    <span bind:this={durationText}>00:00</span>
  </div>
  <div class="controls">
    <button class="jump-button back" on:click={jumpBack}>
      <img src="/assets/back.png" alt="Back 10" />
    </button>
    <button class="main" class:pause={isPlaying} on:click={togglePlay}>
      <img src={isPlaying ? "/assets/pause.png" : "/assets/play.png"} alt={isPlaying ? "Pause" : "Play"} />
    </button>
    <button class="jump-button forward" on:click={jumpForward}>
      <img src="/assets/forward.png" alt="Forward 10" />
    </button>
  </div>
</div>

<style>
  .player { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-top: 16px; }
  .progress-bar { width: 100%; height: 7px; border-radius: 4px; background: #e0e0e0; position: relative; overflow: hidden; cursor: pointer; }
  .progress-fill { background: #4a63ff; height: 100%; width: 0%; border-radius: 4px; }
  .player-times { width: 100%; display: flex; justify-content: space-between; font-size: 14px; color: #666; font-weight: 500; }
  .controls { display: flex; align-items: center; justify-content: center; gap: 8px; }
  .controls button { background: none; border: none; cursor: pointer; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; touch-action: manipulation; }
  .controls .main { width: 44px; height: 44px; opacity: 1; background: #4A83F7; border-radius: 50%; padding: 12px; }
  .controls .main img { width: 100%; height: 100%; object-fit: cover; }
  .controls .jump-button img { width: 34px; height: 34px;}
</style>

