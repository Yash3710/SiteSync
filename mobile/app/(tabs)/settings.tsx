import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleContext, AuthContext } from '../../lib/RoleContext';
import { logout } from '../../lib/api';
import { useI18n } from '../../lib/i18n';

export default function SettingsScreen() {
  const { role } = useContext(RoleContext);
  const { setIsAuthenticated } = useContext(AuthContext);
  const { t } = useI18n();

  const handleLogout = async () => {
    await logout();
    setIsAuthenticated(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 24 }}>
      <Text style={{ fontSize: 28, fontWeight: '700', color: '#0f172a', marginBottom: 32, letterSpacing: -0.5 }}>{t('settings')}</Text>
      
      <View style={{ backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' }}>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc', flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
            <Ionicons name={role === 'manager' ? "briefcase" : "person"} size={20} color="#0284c7" />
          </View>
          <View>
            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500', marginBottom: 2 }}>{t('signedInAs')}</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>
              {role === 'manager' ? t('projectManager') : t('siteWorker')}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={handleLogout}
          style={{ padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fffbfa' }}
        >
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#ef4444' }}>{t('logOut')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
