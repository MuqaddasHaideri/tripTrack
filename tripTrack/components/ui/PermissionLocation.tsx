import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LocationPermissionScreen({ 
  onAllow, 
  onDeny, 
  onOpenSettings, 
  errorType, 
  errorMsg 
}) {
  
  let title = "Allow Location Access";
  let body = "TransitGo needs your location to find nearby bus routes and stops in real time.";
  let primaryAction = onAllow;
  let primaryText = "Allow Location";
  let primaryIcon = "navigate";


  if (errorType === 'permission') {
    title = "Permission Required";
    body = "You have denied location access. We cannot show nearby buses without it. Please enable it in your device Settings.";
    primaryAction = onOpenSettings; 
    primaryText = "Open Settings";
    primaryIcon = "settings-outline";
  } 

  else if (errorType === 'gps') {
    title = "Turn On GPS";
    body = "Permission is granted, but your phone's physical GPS is off. Please swipe down, turn on Location, and try again.";
    primaryAction = onAllow; 
    primaryText = "Try Again";
    primaryIcon = "refresh";
  }

  return (
    <View style={permStyles.container}>
      <View style={permStyles.iconRing}>
        <Ionicons name={errorType === 'gps' ? "satellite" : "location"} size={44} color="#00C853" />
      </View>
      <Text style={permStyles.title}>{title}</Text>
      <Text style={permStyles.body}>{body}</Text>
      
      {/* Dynamic Main Action Button */}
      <TouchableOpacity style={permStyles.allowBtn} onPress={primaryAction}>
        <Ionicons name={primaryIcon} size={18} color="#fff" />
        <Text style={permStyles.allowText}>{primaryText}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={permStyles.denyBtn} onPress={onDeny}>
        <Text style={permStyles.denyText}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
}

const permStyles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#021a11', alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconRing:   { width: 96, height: 96, borderRadius: 48, backgroundColor: '#E8FFF1', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title:      { fontSize: 24, fontWeight: '800', color: '#fffcfc', textAlign: 'center', marginBottom: 12 },
  body:       { fontSize: 15, color: '#c5e3da', textAlign: 'center', lineHeight: 22, marginBottom: 36 },
  allowBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#00C853', paddingVertical: 16, paddingHorizontal: 36, borderRadius: 14, marginBottom: 14, elevation: 3 },
  allowText:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  denyBtn:    { paddingVertical: 10 },
  denyText:   { fontSize: 14, color: '#999' }
});