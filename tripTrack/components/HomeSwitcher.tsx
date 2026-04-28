import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import PassengerMap from '../app/passenger/passengerMap';
import DriverMapScreen from '../app/driver/Map';

export default function HomeScreenSwitcher() {
  const { user, isInitialized } = useSelector((state) => state.auth);


  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#196F31" />
      </View>
    );
  }


  if (user?.role === 'driver') {
    return <DriverMapScreen />;
  }


  return <PassengerMap />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F0F9F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
});