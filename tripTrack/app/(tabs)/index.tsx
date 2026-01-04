if (__DEV__) {
  require("../../reactotron");
}

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
// import * as Location from 'expo-location';

export default function PassengerMap() {
  // const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // 1. Get User Permissions on Load
  // useEffect(() => {
  //   (async () => {
  //     let { status } = await Location.requestForegroundPermissionsAsync();
  //     if (status !== 'granted') {
  //       setErrorMsg('Permission to access location was denied');
  //       return;
  //     }

  //     let location = await Location.getCurrentPositionAsync({});
  //     setLocation(location.coords);
  //   })();
  // }, []);

  return (
    <View style={styles.container}>

      <MapView 
        style={styles.map} 
        initialRegion={{
          latitude: 24.8607, 
          longitude: 67.0011,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        showsUserLocation={true} 
      >
      </MapView>
      <View style={styles.searchContainer}>
        <Text style={styles.searchText}>Where to?</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5, 
  },
  searchText: {
    fontSize: 16,
    color: '#555',
    fontWeight: 'bold',
  },
});