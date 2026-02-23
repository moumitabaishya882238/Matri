import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import 'react-native-get-random-values';

const LOGS_KEY = '@matri_health_logs';

class OfflineStorageService {
    static async saveLogLocal(logData) {
        try {
            const existing = await AsyncStorage.getItem(LOGS_KEY);
            const logs = existing ? JSON.parse(existing) : [];

            const newLog = {
                localId: uuidv4(),
                ...logData, // bp_systolic, bleeding, pain, etc.
                syncStatus: 'pending',
                date: new Date().toISOString()
            };

            logs.push(newLog);
            await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
            return newLog;
        } catch (error) {
            console.error("Failed to save local log:", error);
            throw error;
        }
    }

    static async getPendingLogs() {
        try {
            const existing = await AsyncStorage.getItem(LOGS_KEY);
            const logs = existing ? JSON.parse(existing) : [];
            return logs.filter(log => log.syncStatus === 'pending');
        } catch (error) {
            console.error("Failed to get pending logs:", error);
            return [];
        }
    }

    static async markLogsAsSynced(localIds) {
        try {
            const existing = await AsyncStorage.getItem(LOGS_KEY);
            let logs = existing ? JSON.parse(existing) : [];

            logs = logs.map(log =>
                localIds.includes(log.localId) ? { ...log, syncStatus: 'synced' } : log
            );

            await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(logs));
        } catch (error) {
            console.error("Failed to mark logs as synced:", error);
        }
    }

    static async clearAllLogs() {
        await AsyncStorage.removeItem(LOGS_KEY);
    }
}

export default OfflineStorageService;
