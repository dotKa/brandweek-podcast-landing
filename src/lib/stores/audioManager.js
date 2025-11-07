import { writable } from 'svelte/store';

// Aktif olan audio element'ini tutar
export const activeAudioElement = writable(null);

/**
 * Yeni bir audio başlatıldığında çağrılır
 * Önceki audio'yu durdurur
 */
export function setActiveAudio(audioElement) {
	activeAudioElement.update((current) => {
		// Önceki audio'yu durdur
		if (current && current !== audioElement && !current.paused) {
			current.pause();
		}
		return audioElement;
	});
}

/**
 * Audio durdurulduğunda çağrılır
 */
export function clearActiveAudio(audioElement) {
	activeAudioElement.update((current) => {
		if (current === audioElement) {
			return null;
		}
		return current;
	});
}

