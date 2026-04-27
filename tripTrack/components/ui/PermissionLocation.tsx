import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LocationPermissionScreen({ 
  onAllow, 
  onDeny, 
  onOpenSettings, 
  errorType 
}) {
  
  let title = "Allow Location Access";
  let body = "TransitGo needs your location to find nearby bus routes and stops in real time.";
  let primaryAction = onAllow;
  let primaryText = "Allow Location";
  let primaryIcon = "navigate";

  if (errorType === 'permission') {
    title = "Permission Required";
    body = "You have denied location access. We cannot show nearby buses without it. Please enable it in Settings.";
    primaryAction = onOpenSettings; 
    primaryText = "Open Settings";
    primaryIcon = "settings-outline";
  } 
  else if (errorType === 'gps') {
    title = "Turn On GPS";
    body = "Permission is granted, but your phone's physical GPS is off. Please turn on Location and try again.";
    primaryAction = onAllow; 
    primaryText = "Try Again";
    primaryIcon = "refresh";
  }

  return (
    <View style={permStyles.container}>
      <View style={permStyles.contentCard}>
        <View style={permStyles.iconRing}>
          <View style={permStyles.iconInner}>
            <Ionicons 
              name={errorType === 'gps' ? "location-outline" : "map-outline"} 
              size={40} 
              color="#196F31" 
            />
          </View>
        </View>

        <Text style={permStyles.title}>{title}</Text>
        <Text style={permStyles.body}>{body}</Text>
        
        <View style={permStyles.buttonContainer}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            style={permStyles.allowBtn} 
            onPress={primaryAction}
          >
            <Ionicons name={primaryIcon} size={20} color="#fff" />
            <Text style={permStyles.allowText}>{primaryText}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={permStyles.denyBtn} 
            onPress={onDeny}
          >
            <Text style={permStyles.denyText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const permStyles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F9F4', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 24 
  },
  contentCard: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  iconRing: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: 'rgba(25, 111, 49, 0.1)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 32 
  },
  iconInner: {
    width: 70, 
    height: 70, 
    borderRadius: 35, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#123D1F', 
    textAlign: 'center', 
    marginBottom: 16,
    letterSpacing: -0.5
  },
  body: { 
    fontSize: 16, 
    color: '#4A6B54', 
    textAlign: 'center', 
    lineHeight: 24, 
    marginBottom: 44,
    paddingHorizontal: 10
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20
  },
  allowBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 10, 
    backgroundColor: '#196F31', 
    paddingVertical: 18, 
    borderRadius: 16, 
    marginBottom: 12,
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6 
  },
  allowText: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#fff' 
  },
  denyBtn: { 
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#196F31', 
    backgroundColor: '#F0F9F4', 
    alignItems: 'center',
    justifyContent: 'center'
  },
  denyText: { 
    fontSize: 16, 
    fontWeight: '600',
    color: '#196F31'
  }
});