<script>
  import { createEventDispatcher } from "svelte";
  import AudioPlayer from "./AudioPlayer.svelte";

  let { session } = $props();

  let isActive = $state(false);
  let audioElement;
  let audioDuration = $state(session.duration || 0);

  const dispatch = createEventDispatcher();

  // Session'ın içeriği var mı kontrol et (audioUrl veya summary)
  const hasContent = $derived(session.audioUrl || session.summary);
  // Session aktif mi ve içeriği var mı?
  const isSessionActive = $derived(session.active && hasContent);

  function toggleSession() {
    if (!isSessionActive) return;
    isActive = !isActive;
    dispatch("toggle", { sessionId: session.id, isActive });
  }

  function pauseAllExcept() {
    dispatch("pauseOthers", session.id);
  }

  function handleDuration(event) {
    audioDuration = event.detail;
  }
</script>

<div
  class="session"
  class:inactive={!isSessionActive}
  class:active={isActive && isSessionActive}
>
  <div class="session-top" on:click={toggleSession}>
    <div class="session-number">#{session.order}</div>
    <div class="session-info">
      <div class="session-title">{session.title}</div>
      <div class="session-meta">
        {audioDuration > 0 ? audioDuration : session.duration} dk
        <span class="separator">|</span>
        {session.date}
      </div>
    </div>
    {#if !isActive}
      <button
        class="play-btn"
        on:click={(e) => {
          e.stopPropagation();
          toggleSession();
        }}
      >
        <img src="/assets/play.png" alt="Play" />
      </button>
    {:else}
      <button
        class="collapse-btn"
        on:click={(e) => {
          e.stopPropagation();
          toggleSession();
        }}
      >
        <img src="/assets/collapse.png" alt="Collapse" />
      </button>
    {/if}
  </div>
  <div class="collapse">
    {#if session.audioUrl}
      <AudioPlayer audioUrl={session.audioUrl} on:duration={handleDuration} />
    {/if}
    {#if session.summary}
      <div class="summary">
        <strong>Oturum Özeti:</strong>
        <div class="summary-text">{session.summary}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .session {
    background: #ffffff;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }
  .session.inactive {
    opacity: 1;
    pointer-events: none;
  }
  .session.inactive .session-title {
    color: #5e5e5e;
  }
  .session.inactive .session-meta {
    color: #b1b1b1;
  }
  .session.inactive .session-number {
    background: #b3b3b3;
    color: #fff;
  }
  .session.inactive .play-btn {
    background: #b3b3b3;
  }
  .session-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    touch-action: manipulation;
    user-select: none;
  }
  .session-number {
    background: #4a63ff;
    color: white;
    border-radius: 10px;
    width: 36px;
    height: 36px;
    padding: 8px;
    font-weight: 400;
    font-size: 20px;
    flex-shrink: 0;
  }
  .session-info {
    flex-grow: 1;
    margin: 0 14px;
  }
  .session-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.4;
  }
  .session-meta {
    font-size: 16px;
    color: #a1a1a1;
    margin-top: 2px;
    font-weight: 400;
  }
  .play-btn {
    padding: 12px;
    background: #4a63ff;
    border: none;
    border-radius: 50%;
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }
  .play-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
  .collapse {
    max-height: 0;
    overflow: hidden;
    transition:
      max-height 0.4s ease,
      padding 0.4s ease;
  }
  .session.active .collapse {
    max-height: 1024px;
    padding-top: 16px;
  }
  .session.active .play-btn {
    display: none;
  }
  .session .collapse-btn {
    display: none;
  }
  .session.active .collapse-btn {
    padding: 12px;
    background: transparent;
    border: none;
    border-radius: 50%;
    width: 46px;
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    touch-action: manipulation;
  }
  .session.active .collapse-btn img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .summary {
    font-size: 18px;
    color: #1a1a1a;
    line-height: 25px;
    margin-top: 16px;
    font-weight: 400;
  }
  .summary strong {
    font-weight: 600;
    display: block;
    margin-bottom: 8px;
  }
  .summary-text {
    white-space: pre-line;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  .separator {
    margin: 0 4px;
    color: #a1a1a1;
  }

  @media (max-width: 768px) {
  .session-number {
    height: 56px;
    }
    .session-title {
    font-size: 14px;
  }
  .session-meta {
    font-size: 12px;
  }
  .summary {
    font-size: 15px;
  }

  }
</style>
