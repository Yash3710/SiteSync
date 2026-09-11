import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReviewQueue, confirmMatch, markUnplanned } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export default function ReviewQueueScreen() {
  const [queue, setQueue] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useI18n();

  const loadData = async () => {
    try { setQueue(await getReviewQueue()); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const handleConfirm = async (reportId: number) => {
    try { await confirmMatch(reportId); loadData(); } catch (e) { Alert.alert("Error", "Failed to confirm."); }
  };

  const handleReject = async (reportId: number) => {
    try { await markUnplanned(reportId); loadData(); } catch (e) { Alert.alert("Error", "Failed to reject."); }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={{ backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', borderLeftWidth: 4, borderLeftColor: '#f59e0b' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('supervisorReport')}</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>{item.worker_name || 'Unknown Worker'}</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: '500', color: '#0f172a', marginBottom: item.translated_text && item.translated_text !== item.raw_text ? 4 : 16, fontStyle: 'italic' }}>"{item.translated_text || item.raw_text}"</Text>
      {item.translated_text && item.translated_text !== item.raw_text && (
        <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic', marginBottom: 16 }}>Original: "{item.raw_text}"</Text>
      )}
      
      <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ color: '#475569', fontSize: 13, marginBottom: 4 }}>
          <Text style={{ fontWeight: '600' }}>{t('extracted')} </Text>{item.extracted_task}
        </Text>
        <Text style={{ color: '#475569', fontSize: 13 }}>
          <Ionicons name="location-outline" size={12} /> {item.extracted_location || 'Unknown'}
        </Text>
      </View>

      <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>{t('aiSuggestion')}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 4 }}>{item.planned_task_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 13, color: '#64748b' }}>{item.planned_location}</Text>
          </View>
        </View>
        <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#b45309' }}>{Math.round(item.confidence_score * 100)}%</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity onPress={() => handleReject(item.id)} style={{ flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: '#475569' }}>{t('reject')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleConfirm(item.id)} style={{ flex: 1, backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}>
          <Text style={{ fontWeight: '600', fontSize: 14, color: '#ffffff' }}>{t('accept')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={queue}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} />}
        ListHeaderComponent={<Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 20, letterSpacing: -0.5 }}>{t('reviewQueue')}</Text>}
        ListEmptyComponent={<Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>{t('queueEmpty')}</Text>}
      />
    </View>
  );
}
