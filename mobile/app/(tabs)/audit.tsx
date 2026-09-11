import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuditTrail } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export default function AuditTrailScreen() {
  const [trail, setTrail] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useI18n();

  const loadData = async () => {
    try { setTrail(await getAuditTrail()); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const badges: any = {
    auto_applied: { text: t('autoLinkedLabel'), color: '#10b981', icon: 'checkmark-circle' },
    needs_review: { text: t('needsReview'), color: '#f59e0b', icon: 'warning' },
    rejected: { text: t('rejected'), color: '#ef4444', icon: 'close-circle' },
    no_match: { text: t('noMatch'), color: '#64748b', icon: 'help-circle' },
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    const b = badges[item.review_status] || badges.no_match;
    return (
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {/* Timeline Line & Dot */}
        <View style={{ alignItems: 'center', marginRight: 16 }}>
          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: b.color, marginTop: 4, zIndex: 2 }} />
          {index !== trail.length - 1 && (
            <View style={{ width: 2, flex: 1, backgroundColor: '#e2e8f0', marginTop: 4, marginBottom: -24 }} />
          )}
        </View>

        {/* Card */}
        <View style={{ flex: 1, backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>
              {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={b.icon as any} size={12} color={b.color} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: b.color, textTransform: 'uppercase' }}>{b.text}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 15, fontWeight: '500', color: '#334155', marginBottom: item.translated_text && item.translated_text !== item.raw_text ? 4 : 8, fontStyle: 'italic' }}>"{item.translated_text || item.raw_text}"</Text>
          {item.translated_text && item.translated_text !== item.raw_text && (
            <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginBottom: 8 }}>Original: "{item.raw_text}"</Text>
          )}
          {item.planned_task_name && (
            <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, marginTop: 4 }}>
              <Text style={{ fontSize: 13, color: '#64748b' }}>
                {t('linkedTo')} <Text style={{ fontWeight: '600', color: '#0f172a' }}>{item.planned_task_name}</Text>
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <FlatList
        data={trail}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} />}
        ListHeaderComponent={<Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 24, letterSpacing: -0.5 }}>{t('auditTrail')}</Text>}
        ListEmptyComponent={<Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>{t('noReports')}</Text>}
      />
    </View>
  );
}
