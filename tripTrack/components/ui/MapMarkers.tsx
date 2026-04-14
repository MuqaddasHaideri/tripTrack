import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function UserLocationMarker() {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulse, { toValue: 2.2, duration: 1200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1,   duration: 0,    useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 1200, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0,  useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={userMarkerStyles.wrapper}>
      <Animated.View style={[userMarkerStyles.ring, { transform: [{ scale: pulse }], opacity }]} />
      <View style={userMarkerStyles.dot}>
        <View style={userMarkerStyles.dotInner} />
      </View>
    </View>
  );
}

export function StopMarker({ color }) {
  return (
    <View style={[stopStyles.outer, { borderColor: color }]}>
      <View style={[stopStyles.inner, { backgroundColor: color }]} />
    </View>
  );
}

export function TerminalMarker({ label, color, isEnd }) {
  return (
    <View style={[termStyles.bubble, { backgroundColor: color }]}>
      <Ionicons name={isEnd ? 'flag' : 'bus'} size={12} color="#fff" />
      <Text style={termStyles.label}>{label}</Text>
    </View>
  );
}

const userMarkerStyles = StyleSheet.create({
  wrapper:   { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  // Changed backgroundColor to Red (#FF3B30)
  ring:      { position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF3B30', opacity: 0.4 },
  // Changed backgroundColor to Red (#FF3B30)
  dot:       { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FF3B30', borderWidth: 2.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  dotInner:  { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
});

const stopStyles = StyleSheet.create({
  outer: { width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  inner: { width: 5, height: 5, borderRadius: 2.5 },
});

const termStyles = StyleSheet.create({
  bubble: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, elevation: 4 },
  label:  { fontSize: 11, fontWeight: '700', color: '#fff' },
});