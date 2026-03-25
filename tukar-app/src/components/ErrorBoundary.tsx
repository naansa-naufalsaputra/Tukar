import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertOctagon, RefreshCcw } from 'lucide-react-native';
import { Logger } from '@/lib/logger';
import i18n from '@/lib/i18n';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorMsg: ''
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state agar render berikutnya menunjukkan UI fallback
        return { hasError: true, errorMsg: error.message };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Catat error ke sistem Logger kita
        Logger.error('Unhandled UI Crash:', error);
        Logger.error('Component Stack:', errorInfo.componentStack);
    }

    private handleReset = () => {
        this.setState({ hasError: false, errorMsg: '' });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={{ flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <View style={{ width: 64, height: 64, backgroundColor: 'rgba(244, 63, 94, 0.2)', borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
                        <AlertOctagon size={32} color="#f43f5e" />
                    </View>
                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>{i18n.t('errorTitle')}</Text>
                    <Text style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 24 }}>
                        {i18n.t('errorDesc')}
                    </Text>

                    {/* Tampilkan pesan error teknis hanya di mode development */}
                    {__DEV__ && (
                        <View style={{ backgroundColor: '#0f172a', padding: 16, borderRadius: 12, width: '100%', marginBottom: 24 }}>
                            <Text style={{ color: '#ef4444', fontSize: 12, fontFamily: 'monospace' }}>
                                {this.state.errorMsg}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity
                        onPress={this.handleReset}
                        style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 99 }}
                    >
                        <RefreshCcw size={16} color="white" style={{ marginRight: 8 }} />
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>{i18n.t('reloadScreen')}</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}
