'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function AutoBackupTrigger() {
    const isRunning = useRef(false);

    useEffect(() => {
        const triggerBackup = async () => {
            if (isRunning.current) return;

            const enabled = localStorage.getItem('auto_cloud_backup') === 'true';
            if (!enabled) return;

            const lastBackup = localStorage.getItem('last_auto_backup');
            const today = new Date().toISOString().split('T')[0];

            // If already backed up today, skip
            if (lastBackup && lastBackup.startsWith(today)) {
                console.log('[Auto-Backup] Already backed up today:', today);
                return;
            }

            isRunning.current = true;
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                console.log('[Auto-Backup] Triggering daily cloud backup...');

                const res = await fetch('/api/backup/auto-cloud', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });

                const data = await res.json();
                if (res.ok) {
                    console.log('[Auto-Backup] Daily backup successful');
                    localStorage.setItem('last_auto_backup', new Date().toISOString());
                    // Optional: toast notification for "system" actions? 
                    // Usually auto-backups should be silent unless they fail.
                } else {
                    console.error('[Auto-Backup] Daily backup failed:', data.error);
                }
            } catch (error) {
                console.error('[Auto-Backup] Error:', error);
            } finally {
                isRunning.current = false;
            }
        };

        // Run on mount (app load)
        triggerBackup();

        // Also check every hour while the app is open
        const interval = setInterval(triggerBackup, 1000 * 60 * 60);
        return () => clearInterval(interval);
    }, []);

    return null; // Invisible component
}
