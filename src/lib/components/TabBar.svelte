<script>
  let { selectedDay = 1, onDayChange } = $props();
  
  function handleClick(day) {
    onDayChange?.(day);
  }
</script>

<div class="tabs">
  <button 
    class="tab" 
    class:active={selectedDay === 1}
    on:click={() => handleClick(1)}
  >
    1. Gün
  </button>
  <button 
    class="tab" 
    class:active={selectedDay === 2}
    on:click={() => handleClick(2)}
  >
    2. Gün
  </button>
  <button 
    class="tab" 
    class:active={selectedDay === 3}
    on:click={() => handleClick(3)}
  >
    3. Gün
  </button>
</div>

<style>

  .tabs { display: flex; justify-content: center; gap: 16px; margin: 24px 0; }
  .tab { border: none; border-radius: 24px; padding: 9px 20px; background: #f8c295; color: white; font-weight: 500; font-size: 20px; cursor: pointer; transition: 0.2s; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; touch-action: manipulation; }
  .tab.active { background: #e87c3e; }

  @media (max-width: 768px) {
    .tabs { display: flex; justify-content: center; gap: 8px; margin: 24px 0; }
    .tab { font-size: 15px; }
  }
</style>

