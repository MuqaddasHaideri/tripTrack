import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = width - 50;
const TAB_WIDTH = CONTAINER_WIDTH / 2;

export default function AuthTabSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  
  const isSignup = pathname.includes('signup');
  const slideAnim = useRef(new Animated.Value(isSignup ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isSignup ? 1 : 0,
      useNativeDriver: false,
      friction: 10,
      tension: 40,
    }).start();
  }, [isSignup]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, TAB_WIDTH - 2], 
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabTrack}>
  
        <Animated.View
          style={[
            styles.activePill,
            { transform: [{ translateX }] },
          ]}
        />

        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.replace('/(auth)/login')}
          activeOpacity={1}
        >
          <Text style={[styles.tabText, !isSignup && styles.activeText]}>
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.replace('/(auth)/signup')}
          activeOpacity={1}
        >
          <Text style={[styles.tabText, isSignup && styles.activeText]}>
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
    height: 60, 
    justifyContent: 'center',
  },
  tabTrack: {
    flexDirection: 'row',
    width: CONTAINER_WIDTH,
    height: 54,
    backgroundColor: '#e8f5ee',
    borderRadius: 27,
    padding: 4,
    position: 'relative',
    alignItems: 'center',
  },
  activePill: {
    position: 'absolute',
    width: TAB_WIDTH - 4,
    height: 46,
    backgroundColor: '#2d5a4c',
    borderRadius: 23,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5a4c',
  },
  activeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});