// ─── Notification Sound via Web Audio API ──────────────────────────────────────
// Generates a professional barbershop bell/ding sound without relying on external files.

export function playNotificationSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();

        // First tone (D5 - 587.33 Hz)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime);

        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.03);
        gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.5);

        // Second, higher tone (A5 - 880 Hz) for a harmonic effect
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);

        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.12);
        gain2.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.12);
        osc2.stop(ctx.currentTime + 0.9);

        // Third, shimmering tone (E6 - 1318.5 Hz)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(1318.5, ctx.currentTime + 0.18);

        gain3.gain.setValueAtTime(0, ctx.currentTime + 0.18);
        gain3.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.2);
        gain3.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);

        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(ctx.currentTime + 0.18);
        osc3.stop(ctx.currentTime + 0.7);

        setTimeout(() => {
            if (ctx.state !== 'closed') ctx.close();
        }, 1200);
    } catch (e) {
        console.warn('Audio not allowed or unavailable:', e);
    }
}

// ─── Browser Notification (Desktop / Mobile) ──────────────────────────────
export async function requestNotificationPermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
}

export function showDesktopNotification(title, options = {}) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
        try {
            new Notification(title, {
                icon: '/favicon.svg',
                badge: '/favicon.svg',
                silent: false,
                ...options
            });
        } catch (e) {
            console.warn('Error triggering native notification:', e);
        }
    }
}
