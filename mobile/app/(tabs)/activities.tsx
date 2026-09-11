import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActivities, addScheduleItem, uploadScheduleFile, deleteScheduleItem } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import * as DocumentPicker from 'expo-document-picker';

export default function ActivitiesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Add Task Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({ task_name: '', discipline: '', location: '', planned_start: '', planned_end: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { t } = useI18n();

  const loadData = async () => {
    try { setItems(await getActivities()); } catch (e) { console.error(e); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveTask = async () => {
    if (!newTask.task_name) return Alert.alert("Error", "Task name is required");
    setSaving(true);
    try {
      await addScheduleItem(newTask);
      setModalVisible(false);
      setNewTask({ task_name: '', discipline: '', location: '', planned_start: '', planned_end: '' });
      loadData();
    } catch (e) {
      Alert.alert("Error", "Failed to add task");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
        copyToCacheDirectory: true
      });
      if (result.canceled) return;
      
      const file = result.assets[0];
      setUploading(true);
      const res = await uploadScheduleFile(file.uri, file.name, file.mimeType || 'application/octet-stream');
      Alert.alert("Success", `Uploaded and added ${res.inserted} tasks to the schedule!`);
      setModalVisible(false);
      loadData();
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message || "Could not process file");
    } finally {
      setUploading(false);
    }
  };

  const statusStyle: any = {
    done: { color: '#10b981', icon: 'checkmark-circle', bg: '#ecfdf5' },
    in_progress: { color: '#0ea5e9', icon: 'sync', bg: '#f0f9ff' },
    flagged: { color: '#ef4444', icon: 'warning', bg: '#fef2f2' },
    pending: { color: '#94a3b8', icon: 'time', bg: '#f8fafc' },
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to remove this task from the schedule?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScheduleItem(id);
              loadData();
            } catch (e) {
              Alert.alert("Error", "Could not delete task.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const s = statusStyle[item.status] || statusStyle.pending;
    return (
      <View style={{ backgroundColor: '#ffffff', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', borderLeftWidth: 4, borderLeftColor: s.color, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', flex: 1, color: '#0f172a', paddingRight: 12, lineHeight: 22 }}>{item.task_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginRight: 8 }}>
              <Ionicons name={s.icon as any} size={14} color={s.color} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: s.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t(item.status)}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="location-outline" size={14} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 14, color: '#475569', fontWeight: '500' }}>{item.location}</Text>
          <Text style={{ fontSize: 14, color: '#cbd5e1', marginHorizontal: 8 }}>|</Text>
          <Ionicons name="construct-outline" size={14} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 14, color: '#475569' }}>{item.discipline}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 8, borderRadius: 8, alignSelf: 'flex-start', marginTop: 4 }}>
          <Ionicons name="calendar-outline" size={14} color="#94a3b8" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500' }}>{item.planned_start} <Text style={{ color: '#cbd5e1' }}>→</Text> {item.planned_end}</Text>
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
        ListHeaderComponent={
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5, marginBottom: 16 }}>{t('activityBoard')}</Text>
            <TouchableOpacity 
              onPress={handleFileUpload}
              disabled={uploading}
              style={{ backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 }}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#ea580c" style={{ marginRight: 10 }} />
              ) : (
                <View style={{ backgroundColor: '#fff7ed', padding: 6, borderRadius: 8, marginRight: 10 }}>
                  <Ionicons name="document-text" size={18} color="#ea580c" />
                </View>
              )}
              <View>
                <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '600' }}>{uploading ? 'Processing File...' : 'Upload Schedule File'}</Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>.csv, .xlsx, or Primavera</Text>
              </View>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={<Text style={{ fontSize: 15, color: '#94a3b8', textAlign: 'center', marginTop: 60 }}>{t('noActivities')}</Text>}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={{ position: 'absolute', bottom: 32, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#ea580c', justifyContent: 'center', alignItems: 'center', shadowColor: '#ea580c', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 }}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingTop: 32, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 24 }}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a', letterSpacing: -0.5 }}>Add Planned Task</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 16 }}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Task Name</Text>
                <TextInput 
                  style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a', marginBottom: 20 }}
                  placeholder="e.g. Foundation Pour"
                  placeholderTextColor="#94a3b8"
                  value={newTask.task_name}
                  onChangeText={(t) => setNewTask({...newTask, task_name: t})}
                />

                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 20 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Location</Text>
                    <TextInput 
                      style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' }}
                      placeholder="e.g. Zone A"
                      placeholderTextColor="#94a3b8"
                      value={newTask.location}
                      onChangeText={(t) => setNewTask({...newTask, location: t})}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Discipline</Text>
                    <TextInput 
                      style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' }}
                      placeholder="e.g. Civil"
                      placeholderTextColor="#94a3b8"
                      value={newTask.discipline}
                      onChangeText={(t) => setNewTask({...newTask, discipline: t})}
                    />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Start Date</Text>
                    <TextInput 
                      style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={newTask.planned_start}
                      onChangeText={(t) => setNewTask({...newTask, planned_start: t})}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>End Date</Text>
                    <TextInput 
                      style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' }}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={newTask.planned_end}
                      onChangeText={(t) => setNewTask({...newTask, planned_end: t})}
                    />
                  </View>
                </View>
              </ScrollView>

              <TouchableOpacity 
                onPress={handleSaveTask}
                disabled={saving || uploading}
                style={{ backgroundColor: '#ea580c', paddingVertical: 16, borderRadius: 16, alignItems: 'center', opacity: (saving || uploading) ? 0.7 : 1 }}
              >
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>{saving ? 'Saving...' : 'Add to Schedule'}</Text>
              </TouchableOpacity>
              
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}
