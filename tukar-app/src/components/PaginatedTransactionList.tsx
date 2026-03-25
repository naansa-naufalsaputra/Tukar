import React, { useEffect, useCallback } from 'react';
import { View, FlatList, ActivityIndicator, Text } from 'react-native';
import { useStoreV2 } from '@/store/v2/useStoreV2';
import { TransactionItem } from './TransactionItem'; // Assuming you have this standard component

interface Props {
    userId: string;
}

export const PaginatedTransactionList: React.FC<Props> = ({ userId }) => {
    // 1. Subscribe ONLY to the state you need from V2 Store to prevent over-renders
    const transactions = useStoreV2((state) => state.transactions);
    const isLoading = useStoreV2((state) => state.isLoadingTransactions);
    const pagination = useStoreV2((state) => state.transactionPagination);
    const fetchTransactions = useStoreV2((state) => state.fetchTransactions);

    // 2. Initial Data Fetch
    useEffect(() => {
        // When component mounts, fetch page 1
        if (userId) {
            fetchTransactions(userId, 1);
        }
    }, [userId]);

    // 3. The magic of Infinite Scrolling -> onEndReached handler
    const loadMore = useCallback(() => {
        // Prevent fetching if we are already loading or if there's no more data
        if (!isLoading && pagination.hasMore) {
            fetchTransactions(userId, pagination.currentPage + 1);
        }
    }, [isLoading, pagination, userId, fetchTransactions]);

    // 4. Loading Spinner for the bottom of the list
    const renderFooter = () => {
        if (!isLoading) return null;
        return (
            <View className="py-4 items-center justify-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="text-xs text-gray-500 mt-2">Memuat transaksi lama...</Text>
            </View>
        );
    };

    return (
        <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TransactionItem transaction={item} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={renderFooter}
            refreshing={isLoading && pagination.currentPage === 1}
            onRefresh={() => {
                import('@/lib/sounds').then(({ playSound }) => playSound('clink'));
                fetchTransactions(userId, 1);
            }}
            ListEmptyComponent={
                !isLoading ? (
                    <View className="flex-1 items-center justify-center py-10">
                        <Text className="text-gray-500">Belum ada transaksi</Text>
                    </View>
                ) : <View />
            }
        />
    );
};