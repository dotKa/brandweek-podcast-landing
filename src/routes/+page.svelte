<script>
  import Header from '$lib/components/Header.svelte';
  import TabBar from '$lib/components/TabBar.svelte';
  import SessionCard from '$lib/components/SessionCard.svelte';
  
  let { data } = $props();
  
  let selectedDay = $state(1);
  let sessions = $state(data.sessions || []);
  let filteredSessions = $derived(sessions.filter(s => s.day === selectedDay));
  
  function handleDayChange(day) {
    selectedDay = day;
  }
  
  function handleSessionToggle(event) {
    // Session toggle işlemi SessionCard içinde yönetiliyor
  }
  
  function handlePauseOthers(sessionId) {
    // Audio player'lar kendi içlerinde yönetiliyor
  }
</script>

<svelte:head>
  <title>Brand Week Oturum Özetleri</title>
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<Header />

<TabBar selectedDay={selectedDay} onDayChange={(day) => { selectedDay = day; }} />

<div class="sessions">
  {#each filteredSessions as session (session.id)}
    <SessionCard 
      {session} 
      on:toggle={handleSessionToggle}
      on:pauseOthers={handlePauseOthers}
    />
  {/each}
</div>

<style>
  .sessions { padding: 0 20px 40px; max-width: 425px; margin: auto; }
</style>

