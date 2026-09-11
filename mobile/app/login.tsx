import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView, Modal, FlatList, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loginWorker, loginManager } from '../lib/api';
import { RoleContext, AuthContext } from '../lib/RoleContext';
import { useI18n, LANGUAGES } from '../lib/i18n';

export default function LoginScreen() {
  const [mode, setMode] = useState<'worker' | 'manager'>('worker');
  const [joinCode, setJoinCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  
  const { setRole } = useContext(RoleContext);
  const { setIsAuthenticated } = useContext(AuthContext);
  const { t, lang, setLang } = useI18n();

  const currentLang = LANGUAGES.find(l => l.code === lang)!;

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (mode === 'worker') {
        if (!joinCode.trim()) throw new Error("Please enter a Project Join Code");
        await loginWorker(joinCode);
        setRole('worker');
      } else {
        if (!email.trim()) throw new Error("Please enter your email");
        await loginManager(email);
        setRole('manager');
      }
      setIsAuthenticated(true);
    } catch (err: any) {
      Alert.alert("Authentication Error", err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
            
            {/* Header Area */}
            <View style={{ paddingHorizontal: 32, paddingTop: 40, paddingBottom: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <View style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', marginBottom: 20, backgroundColor: '#fff' }}>
                  <Image source={require('../assets/images/logo.jpg')} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
                </View>
                <Text style={{ fontSize: 36, fontWeight: '700', color: '#ffffff', letterSpacing: -1 }}>{t('appName')}</Text>
                <Text style={{ fontSize: 15, color: '#94a3b8', marginTop: 4, letterSpacing: 0.5 }}>{t('tagline')}</Text>
              </View>

              <TouchableOpacity 
                onPress={() => setLangOpen(true)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
              >
                <Ionicons name="globe-outline" size={16} color="#cbd5e1" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#cbd5e1' }}>{currentLang.label}</Text>
              </TouchableOpacity>
            </View>

            {/* Main Card */}
            <View style={{ flex: 1, backgroundColor: '#ffffff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 32, paddingBottom: 60 }}>
              
              {/* Role Tabs */}
              <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 32 }}>
                <TouchableOpacity onPress={() => setMode('worker')} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: mode === 'worker' ? '#ffffff' : 'transparent', shadowColor: mode === 'worker' ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: mode === 'worker' ? 0.05 : 0, shadowRadius: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: mode === 'worker' ? '#0f172a' : '#64748b' }}>{t('siteWorker')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMode('manager')} style={{ flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: mode === 'manager' ? '#ffffff' : 'transparent', shadowColor: mode === 'manager' ? '#000' : 'transparent', shadowOffset: { width: 0, height: 1 }, shadowOpacity: mode === 'manager' ? 0.05 : 0, shadowRadius: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: mode === 'manager' ? '#0f172a' : '#64748b' }}>{t('manager')}</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 24, fontWeight: '700', color: '#0f172a', marginBottom: 24, letterSpacing: -0.5 }}>
                {mode === 'worker' ? t('joinProject') : t('managerLogin')}
              </Text>

              {mode === 'worker' ? (
                <View style={{ marginBottom: 32 }}>
                  <Text style={{ color: '#475569', fontWeight: '500', fontSize: 13, marginBottom: 8 }}>{t('joinCode')}</Text>
                  <TextInput 
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' }} 
                    placeholder="Enter project code" 
                    placeholderTextColor="#94a3b8" 
                    autoCapitalize="characters" 
                    value={joinCode} 
                    onChangeText={setJoinCode} 
                  />
                  <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>{t('askSupervisor')}</Text>
                </View>
              ) : (
                <View style={{ marginBottom: 32 }}>
                  <Text style={{ color: '#475569', fontWeight: '500', fontSize: 13, marginBottom: 8 }}>{t('workEmail')}</Text>
                  <TextInput 
                    style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 16, color: '#0f172a' }} 
                    placeholder="name@company.com" 
                    placeholderTextColor="#94a3b8" 
                    autoCapitalize="none" 
                    keyboardType="email-address" 
                    value={email} 
                    onChangeText={setEmail} 
                  />
                </View>
              )}

              <TouchableOpacity onPress={handleLogin} disabled={loading} style={{ backgroundColor: '#ea580c', borderRadius: 12, paddingVertical: 16, alignItems: 'center', opacity: loading ? 0.7 : 1 }}>
                {loading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>{mode === 'worker' ? t('connect') : t('login')}</Text>}
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Language Modal */}
      <Modal visible={langOpen} transparent animationType="fade">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setLangOpen(false)}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}>{t('language')}</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => { setLang(item.code); setLangOpen(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: lang === item.code ? '600' : '400', color: lang === item.code ? '#ea580c' : '#334155' }}>{item.label}</Text>
                  {lang === item.code && <Ionicons name="checkmark" size={20} color="#ea580c" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
