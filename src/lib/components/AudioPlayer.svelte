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
  
  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }
  
  function togglePlay() {
    if (!audioElement) return;
    
    if (audioElement.paused) {
      // Diğer audio'ları durdur ve bu audio'yu aktif yap
      setActiveAudio(audioElement);
      audioElement.play();
      isPlaying = true;
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
    audioElement.currentTime = Math.min(audioElement.duration, audioElement.currentTime + 10);
  }
  
  function handleProgressClick(e) {
    if (!audioElement) return;
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    if (duration > 0) {
      audioElement.currentTime = percentage * duration;
    }
  }
  
  function handleTimeUpdate() {
    if (!audioElement) return;
    currentTime = audioElement.currentTime;
    if (currentTimeText) {
      currentTimeText.textContent = formatTime(currentTime);
    }
    if (progressFillElement && duration > 0) {
      const progress = (currentTime / duration) * 100;
      progressFillElement.style.width = `${progress}%`;
    }
  }
  
  function handleLoadedMetadata() {
    if (!audioElement) return;
    duration = audioElement.duration;
    if (durationText) {
      durationText.textContent = formatTime(duration);
    }
    // Duration'ı parent component'e gönder (dakika cinsinden)
    if (duration && !isNaN(duration)) {
      const durationInMinutes = Math.round(duration / 60);
      dispatch('duration', durationInMinutes);
    }
  }
  
  onMount(() => {
    // audioElement bind edildikten sonra event listener'ları ekle
    const setupAudio = () => {
      if (!audioElement) return;
      
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.addEventListener('pause', () => { 
        isPlaying = false;
        clearActiveAudio(audioElement);
      });
      audioElement.addEventListener('play', () => { 
        isPlaying = true;
        setActiveAudio(audioElement);
      });
      
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
    if (audioElement) {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.pause();
      clearActiveAudio(audioElement);
    }
    if (unsubscribe) {
      unsubscribe();
    }
  });
</script>

  <div class="player">
  <audio bind:this={audioElement} src={audioUrl}></audio>
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

