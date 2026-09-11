import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActivities } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export default function ActivitiesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useI18n();

  const loadData = async () => {
    try { setItems(await getActivities()); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const statusStyle: any = {
    done: { color: '#10b981', icon: 'checkmark-circle' },
    in_progress: { color: '#0ea5e9', icon: 'sync' },
    flagged: { color: '#ef4444', icon: 'warning' },
    pending: { color: '#94a3b8', icon: 'time' },
  };

  const renderItem = ({ item }: { item: any }) => {
    const s = statusStyle[item.status] || statusStyle.pending;
    return (
      <View style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', borderLeftWidth: 4, borderLeftColor: s.color }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', flex: 1, color: '#0f172a', paddingRight: 12 }}>{item.task_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={s.icon as any} size={14} color={s.color} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: s.color, textTransform: 'uppercase' }}>{t(item.status)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="location-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 13, color: '#64748b' }}>{item.location}</Text>
          <Text style={{ fontSize: 13, color: '#cbd5e1', marginHorizontal: 6 }}>|</Text>
          <Ionicons name="person-outline" size={12} color="#64748b" style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 13, color: '#64748b' }}>{item.discipline}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={12} color="#94a3b8" style={{ marginRight: 4 }} />
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>{item.planned_start} to {item.planned_end}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} />}
        ListHeaderComponent={<Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 20, letterSpacing: -0.5 }}>{t('activityBoard')}</Text>}
        ListEmptyComponent={<Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>{t('noActivities')}</Text>}
      />
    </View>
  );
}
