if (__DEV__) {
  require("../../reactotron");
}
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import PassengerMap from '../passenger/passengerMap';
import DriverMapScreen from '../driver/Map';

export default function HomeScreenSwitcher() {
  const { user, isLoading } = useSelector((state: any) => state.auth);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00C853" />
      </View>
    );
  }

  // ── THE SWITCH LOGIC ──
  // If a user is logged in AND their role in the database is 'driver', show the Driver UI.
  if (user && user.role === 'driver') {
    return <DriverMapScreen />;
  }

  // Otherwise, default to the Passenger UI. 
  // This catches Guests (!user) AND logged-in Passengers (user.role === 'passenger').
  return <PassengerMap />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#021a11',
    justifyContent: 'center',
    alignItems: 'center',
  }
});