import { Alert } from 'react-native';
import { toast } from './toast';
import { Logger } from './logger';
import i18n from './i18n';

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

interface ErrorDetails {
    severity?: ErrorSeverity;
    context?: string;
    silent?: boolean;
}

class ErrorService {
    /**
     * Centralized handler for all errors.
     * Logs the error and provides user feedback if not silent.
     */
    public handle(error: unknown, details: ErrorDetails = {}) {
        const { severity = ErrorSeverity.MEDIUM, context = 'Global', silent = false } = details;

        // Log for internal tracking
        Logger.error(`[${context}] Error:`, error);

        if (silent) return;

        const message = this.getErrorMessage(error);

        // Provide user feedback
        if (severity === ErrorSeverity.CRITICAL) {
            Alert.alert(i18n.t('error'), message);
        } else {
            toast.error(message);
        }

        // In a real mature app, we would send this to Sentry/Bugsnag here
        // this.reportToCloud(error, context);
    }

    private getErrorMessage(error: unknown): string {
        if (typeof error === 'string') return error;
        if (error instanceof Error) {
            // Handle Zod errors or other specific types if needed
            if (error.name === 'ZodError') {
                return i18n.t('pleaseCheckFormInput');
            }
            return error.message;
        }
        return i18n.t('unexpectedError');
    }

    // Placeholder for future cloud reporting
    // private reportToCloud(error: any, context: string) { ... }
}

export const errorService = new ErrorService();
