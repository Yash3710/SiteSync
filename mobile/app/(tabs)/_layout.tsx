import { Tabs } from "expo-router";
import { useContext } from "react";
import { Ionicons } from '@expo/vector-icons';
import { RoleContext } from "../../lib/RoleContext";
import { useI18n } from "../../lib/i18n";

export default function TabLayout() {
  const { role } = useContext(RoleContext);
  const { t } = useI18n();
  const isWorker = role === 'worker';
  
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: "#ea580c",
      tabBarInactiveTintColor: "#94a3b8",
      tabBarLabelStyle: { fontSize: 11, fontWeight: "500", marginTop: 4 },
      tabBarStyle: { 
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        elevation: 0,
        shadowOpacity: 0,
        paddingTop: 8,
      },
      headerStyle: { 
        backgroundColor: '#ffffff',
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
      },
      headerTitleStyle: { fontWeight: '600', fontSize: 17, color: '#0f172a' },
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: t('dailyProgress'),
          tabBarLabel: t('dailyProgress').split(' ')[0],
          tabBarIcon: ({ color, size }) => <Ionicons name="mic-outline" size={size} color={color} />,
          tabBarItemStyle: isWorker ? {} : { display: 'none' },
        }} 
      />
      
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: t('dashboard'),
          tabBarLabel: t('dashboard'),
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          tabBarItemStyle: isWorker ? { display: 'none' } : {},
        }} 
      />
      <Tabs.Screen 
        name="activities" 
        options={{ 
          title: t('activityBoard'),
          tabBarLabel: t('scheduleStatus').split(' ')[0],
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} />,
          tabBarItemStyle: isWorker ? { display: 'none' } : {},
        }} 
      />
      <Tabs.Screen 
        name="review" 
        options={{ 
          title: t('reviewQueue'),
          tabBarLabel: t('reviewQueue').split(' ')[0],
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
          tabBarItemStyle: isWorker ? { display: 'none' } : {},
        }} 
      />
      <Tabs.Screen 
        name="audit" 
        options={{ 
          title: t('auditTrail'),
          tabBarLabel: t('auditTrail').split(' ')[0],
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
          tabBarItemStyle: isWorker ? { display: 'none' } : {},
        }} 
      />
      <Tabs.Screen 
        name="analytics" 
        options={{ 
          title: t('analytics'),
          tabBarLabel: t('analytics').split(' ')[0],
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
          tabBarItemStyle: isWorker ? { display: 'none' } : {},
        }} 
      />
      
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: t('settings'),
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }} 
      />
    </Tabs>
  );
}
