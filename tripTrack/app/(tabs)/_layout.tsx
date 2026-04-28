import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const themeGreen = '#196F31';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeGreen,
        tabBarInactiveTintColor: '#A0B4A5',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
        tabBarHideOnKeyboard: true,
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />


      <Tabs.Screen
        name="setting"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
  height: Platform.OS === 'ios' ? 90 : 90, 
    elevation: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8F3EB',
    paddingBottom: Platform.OS === 'ios' ? 25 : 12,
    paddingTop: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: Platform.OS === 'ios' ? 0 : 5,
  },
  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#196F31',
    justifyContent: 'center',
    alignItems: 'center',
    top: Platform.OS === 'ios' ? -10 : -14, 
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
});