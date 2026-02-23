import client from '../api/client';
import OfflineStorageService from './OfflineStorageService';
import NetInfo from '@react-native-community/netinfo';

class SyncService {
    static async syncPendingLogs() {
        const networkState = await NetInfo.fetch();
        if (!networkState.isConnected) {
            console.log("Sync skipped: No internet connection.");
            return;
        }

        const pendingLogs = await OfflineStorageService.getPendingLogs();
        if (pendingLogs.length === 0) {
            console.log("Sync skipped: No pending logs to sync.");
            return;
        }

        try {
            console.log(`Attempting to sync ${pendingLogs.length} pending logs...`);

            // Post payload as { logs: [...] } to new batch route
            const response = await client.post('/sync/batch', { logs: pendingLogs });

            if (response.data.success) {
                const syncedIds = pendingLogs.map(l => l.localId);
                await OfflineStorageService.markLogsAsSynced(syncedIds);
                console.log("Sync successfully completed.");
            }
        } catch (error) {
            console.error("Background sync failed:", error.message || error);
        }
    }
}

export default SyncService;
