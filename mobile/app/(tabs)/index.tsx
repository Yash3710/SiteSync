import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Modal } from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { submitReport } from '../../lib/api';
import { useI18n } from '../../lib/i18n';
import { RoleContext } from '../../lib/RoleContext';

export default function FieldLoggingScreen() {
  const { role } = useContext(RoleContext);
  const { t, lang } = useI18n();

  const [text, setText] = useState("");
  const textBeforeRecording = useRef("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  // 2-step submission state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Map our UI language codes to mobile OS speech recognition locales
  const voiceLocales: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    te: 'te-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
  };

  useEffect(() => {
    Voice.onSpeechStart = () => setIsRecording(true);
    Voice.onSpeechEnd = () => setIsRecording(false);
    Voice.onSpeechResults = (e: SpeechResultsEvent) => {
      if (e.value && e.value.length > 0) {
        const base = textBeforeRecording.current.trim();
        const sep = base ? " " : "";
        setText(base + sep + e.value[0]);
      }
    };
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.error(e.error);
      setIsRecording(false);
    };
    return () => { Voice.destroy().then(Voice.removeAllListeners); };
  }, []);

  if (role === 'manager') {
    return <Redirect href="/dashboard" />;
  }

  const toggleRecording = async () => {
    if (isRecording) {
      try { await Voice.stop(); } catch (e) { console.error(e); }
    } else {
      try {
        textBeforeRecording.current = text;
        const locale = voiceLocales[lang] || 'en-US';
        await Voice.start(locale);
      } catch (e) { console.error(e); }
    }
  };

  // Step 1: Preview
  const handlePreview = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await submitReport({ text });
      if (data.error) throw new Error(data.error);
      setPreviewData(data);
      setConfirmVisible(true);
    } catch (err: any) {
      Alert.alert("Error Analyzing", err.message || "Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm
  const handleConfirmSubmit = async () => {
    setConfirmLoading(true);
    try {
      const payload = {
        text,
        confirmed: true,
        extracted: previewData.extracted,
        match: previewData.match,
        review_status: previewData.review_status
      };
      const data = await submitReport(payload);
      if (data.error) throw new Error(data.error);
      
      setResult(data);
      setText("");
      textBeforeRecording.current = "";
      setConfirmVisible(false);
    } catch (err: any) {
      Alert.alert("Error Submitting", err.message || "Failed to submit.");
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 6, letterSpacing: -0.5 }}>{t('dailyProgress')}</Text>
        <Text style={{ fontSize: 15, color: '#64748b', marginBottom: 24 }}>{t('describeWork')}</Text>

        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <TextInput
            style={{ padding: 20, fontSize: 16, minHeight: 180, color: '#334155', textAlignVertical: 'top' }}
            multiline
            placeholder={t('inputPlaceholder')}
            placeholderTextColor="#94a3b8"
            value={text}
            onChangeText={setText}
          />
          
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 12, borderTopWidth: 1, borderTopColor: '#f8fafc' }}>
            <TouchableOpacity 
              onPress={toggleRecording} 
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isRecording ? '#fee2e2' : '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}
            >
              <Ionicons name={isRecording ? "stop" : "mic"} size={16} color={isRecording ? "#ef4444" : "#64748b"} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: isRecording ? '#ef4444' : '#64748b' }}>
                {isRecording ? t('stopRecording') : t('tapToSpeak')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handlePreview} 
          disabled={!text.trim() || loading} 
          style={{ marginTop: 24, backgroundColor: text.trim() ? '#ea580c' : '#cbd5e1', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
        >
          {loading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>{t('submitReport')}</Text>}
        </TouchableOpacity>

        {result && result.finalized && (
          <View style={{ marginTop: 32, padding: 20, backgroundColor: '#ffffff', borderRadius: 16, borderLeftWidth: 4, borderLeftColor: result.review_status === 'auto_applied' ? '#10b981' : result.review_status === 'needs_review' ? '#f59e0b' : '#ef4444', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons 
                name="checkmark-circle" 
                size={24} 
                color="#10b981" 
                style={{ marginRight: 8 }} 
              />
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>
                Successfully Submitted
              </Text>
            </View>
            <Text style={{ fontSize: 14, color: '#64748b' }}>Your report was securely logged and processed by the system.</Text>
          </View>
        )}
      </ScrollView>

      {/* 2-Step Preview Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>Review Analysis</Text>
              <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>AI PREDICTION</Text>
              </View>
            </View>
            
            {previewData && (
              <View style={{ marginBottom: 24 }}>
                {/* AI Status Prediction */}
                <View style={{ backgroundColor: previewData.review_status === 'auto_applied' ? '#ecfdf5' : previewData.review_status === 'needs_review' ? '#fef3c7' : '#fef2f2', padding: 16, borderRadius: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons 
                    name={previewData.review_status === 'auto_applied' ? 'checkmark-circle' : previewData.review_status === 'needs_review' ? 'warning' : 'alert-circle'} 
                    size={24} 
                    color={previewData.review_status === 'auto_applied' ? '#10b981' : previewData.review_status === 'needs_review' ? '#f59e0b' : '#ef4444'} 
                    style={{ marginRight: 12 }} 
                  />
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: previewData.review_status === 'auto_applied' ? '#065f46' : previewData.review_status === 'needs_review' ? '#92400e' : '#991b1b' }}>
                      {previewData.review_status === 'auto_applied' && "Will be Auto-Approved"}
                      {previewData.review_status === 'needs_review' && "Will be Flagged for Review"}
                      {previewData.review_status === 'no_match' && "No Match Found"}
                    </Text>
                    {previewData.match && (
                      <Text style={{ fontSize: 13, color: previewData.review_status === 'auto_applied' ? '#047857' : '#b45309', marginTop: 2 }}>
                        {Math.round(previewData.match.confidence * 100)}% match confidence
                      </Text>
                    )}
                  </View>
                </View>

                {/* Extraction Details */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>What the AI Found</Text>
                <View style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f1f5f9', marginBottom: 16 }}>
                  <Text style={{ fontSize: 15, color: '#334155', marginBottom: 8 }}>
                    <Text style={{ fontWeight: '600', color: '#0f172a' }}>Task: </Text>{previewData.extracted?.task || 'None'}
                  </Text>
                  <Text style={{ fontSize: 15, color: '#334155' }}>
                    <Text style={{ fontWeight: '600', color: '#0f172a' }}>Location: </Text>{previewData.extracted?.location || 'Not specified'}
                  </Text>
                </View>

                {/* Match Details */}
                {previewData.match && (
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Matching Schedule Item</Text>
                    <View style={{ backgroundColor: '#ffffff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a', marginBottom: 4 }}>{previewData.match.schedule_item.task_name}</Text>
                      <Text style={{ fontSize: 14, color: '#64748b' }}><Ionicons name="location-outline" size={14} /> {previewData.match.schedule_item.location}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity 
                onPress={() => setConfirmVisible(false)} 
                disabled={confirmLoading}
                style={{ flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}
              >
                <Text style={{ fontWeight: '600', fontSize: 15, color: '#475569' }}>Edit Text</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleConfirmSubmit} 
                disabled={confirmLoading}
                style={{ flex: 1, backgroundColor: '#ea580c', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }}
              >
                {confirmLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={{ fontWeight: '600', fontSize: 15, color: '#ffffff' }}>Confirm & Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
