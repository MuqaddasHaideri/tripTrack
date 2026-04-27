import { Tabs } from 'expo-router';
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  // Using your specific green theme colors
  const themeGreen = '#196F31';
  const backgroundMint = '#F0F9F4';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeGreen,
        tabBarInactiveTintColor: '#A0B4A5',
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.label,
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      {/* Center "Action" Button (Placeholder or Main Feature) */}
      <Tabs.Screen
        name="action"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButton}>
              <Ionicons name="navigate" size={28} color="white" />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="setting"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 30,
    left: 25,
    right: 25,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    margin: 20,
    height: 65,
    // Elevation for Android
    elevation: 8,
    // Shadow for iOS
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    paddingTop: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#196F31', // Your theme green
    justifyContent: 'center',
    alignItems: 'center',
    top: -12, // Pops it out of the bar
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
});