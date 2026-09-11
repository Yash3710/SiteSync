import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDashboard } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export default function DashboardScreen() {
  const [data, setData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useI18n();

  const loadData = async () => {
    try { setData(await getDashboard()); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 24, paddingBottom: 120 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await loadData(); setRefreshing(false); }} />}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 }}>{t('dashboard')}</Text>
      <Text style={{ fontSize: 15, color: '#64748b', marginBottom: 28 }}>{t('liveOverview')}</Text>
      
      {!data && <Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>{t('loading')}</Text>}

      {data && (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('scheduleStatus')}</Text>
          <View style={{ backgroundColor: '#ffffff', padding: 24, borderRadius: 16, marginBottom: 32, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 40, fontWeight: '700', color: '#0f172a', letterSpacing: -1, lineHeight: 44 }}>{data.schedule.done}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('done')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', paddingBottom: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b' }}>/ {data.schedule.total} Total</Text>
              </View>
            </View>

            {/* Segmented Progress Bar */}
            <View style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, flexDirection: 'row', overflow: 'hidden', marginBottom: 24 }}>
              <View style={{ width: `${(data.schedule.done / Math.max(data.schedule.total, 1)) * 100}%`, backgroundColor: '#10b981' }} />
              <View style={{ width: `${(data.schedule.in_progress / Math.max(data.schedule.total, 1)) * 100}%`, backgroundColor: '#0ea5e9' }} />
              <View style={{ width: `${(data.schedule.flagged / Math.max(data.schedule.total, 1)) * 100}%`, backgroundColor: '#ef4444' }} />
            </View>

            {/* Legend Breakdown */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[
                { label: t('in_progress'), value: data.schedule.in_progress, color: '#0ea5e9' },
                { label: t('pending'), value: data.schedule.pending, color: '#94a3b8' },
                { label: t('flagged'), value: data.schedule.flagged, color: '#ef4444' },
              ].map(stat => (
                <View key={stat.label} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: stat.color, marginRight: 8 }} />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginRight: 6 }}>{stat.value}</Text>
                  <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('aiMatchRouter')}</Text>
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, borderWidth: 1, borderColor: '#f1f5f9' }}>
            {[
              { label: t('autoLinkedLabel'), value: data.reports.auto_applied, color: '#10b981', icon: 'checkmark-circle' },
              { label: t('needsReview'), value: data.reports.needs_review, color: '#f59e0b', icon: 'warning' },
              { label: t('rejected'), value: data.reports.rejected, color: '#ef4444', icon: 'close-circle' },
            ].map((row, i) => (
              <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: '#f8fafc' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={row.icon as any} size={18} color={row.color} style={{ marginRight: 10 }} />
                  <Text style={{ fontSize: 15, fontWeight: '500', color: '#334155' }}>{row.label}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>{row.value}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>{t('totalReports')}</Text>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#ea580c' }}>{data.reports.total}</Text>
            </View>
          </View>

          {data.recent_reports && data.recent_reports.length > 0 && (
            <View style={{ marginTop: 32 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('recentActivity')}</Text>
              {data.recent_reports.map((item: any) => (
                <View key={item.id} style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                  <Ionicons 
                    name={item.review_status === 'auto_applied' ? 'checkmark-circle' : item.review_status === 'needs_review' ? 'warning' : 'close-circle'} 
                    size={20} 
                    color={item.review_status === 'auto_applied' ? '#10b981' : item.review_status === 'needs_review' ? '#f59e0b' : '#ef4444'} 
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155' }} numberOfLines={1}>"{item.translated_text || item.raw_text}"</Text>
                    {item.translated_text && item.translated_text !== item.raw_text && (
                      <Text style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 2 }} numberOfLines={1}>Original: "{item.raw_text}"</Text>
                    )}
                    <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {item.confidence_score ? `${Math.round(item.confidence_score * 100)}% match` : t('noMatch')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
