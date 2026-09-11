import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInstitutionalMemory } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export default function AnalyticsScreen() {
  const [data, setData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useI18n();

  const loadData = async () => {
    try { setData(await getInstitutionalMemory()); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} />}
    >
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 }}>{t('analytics')}</Text>
      <Text style={{ fontSize: 15, color: '#64748b', marginBottom: 28 }}>{t('analyticsDesc')}</Text>
      
      {data.map((item, index) => (
        <View key={index} style={{ backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8, marginRight: 12 }}>
              <Ionicons name="stats-chart" size={16} color="#64748b" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', textTransform: 'capitalize' }}>{item.task_type}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '500' }}>{t('avgPlanned')}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>{item.avg_planned}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '500' }}>{t('avgActual')}</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>{item.avg_actual}</Text>
          </View>

          <View style={{ backgroundColor: item.avg_delay > 0 ? '#fef2f2' : '#f0fdf4', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontWeight: '600', fontSize: 13, color: item.avg_delay > 0 ? '#b91c1c' : '#15803d' }}>{t('avgDelay')}</Text>
            <Text style={{ fontWeight: '700', fontSize: 16, color: item.avg_delay > 0 ? '#ef4444' : '#10b981' }}>
              {item.avg_delay > 0 ? '+' : ''}{item.avg_delay}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
