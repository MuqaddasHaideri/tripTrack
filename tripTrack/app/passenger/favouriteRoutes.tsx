import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, 
  StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';


import { fetchMyFavoritesApi, removeFavoriteApi } from '../../service/server';

export default function FavoriteRoutesScreen() {
  const router = useRouter();
  

  const { token } = useSelector((state: any) => state.auth);


  const [favoriteRoutes, setFavoriteRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (token) {
        loadFavorites();
      } else {
        setIsLoading(false);
      }
    }, [token])
  );

  const loadFavorites = async () => {
    try {
      const data = await fetchMyFavoritesApi(token);
      if (data.success && data.favorites) {
        setFavoriteRoutes(data.favorites);
      }
    } catch (e) {
      console.log("Error loading favorite routes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (routeId: string, name: string) => {
    Alert.alert(
      "Remove Favorite", 
      `Are you sure you want to remove ${name} from your shortcuts?`, 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          style: "destructive", 
          onPress: () => executeRemoval(routeId) 
        }
      ]
    );
  };

  const executeRemoval = async (routeId: string) => {
    setIsDeletingId(routeId);
    try {
      const data = await removeFavoriteApi(routeId, token);
      if (data.success) {
        setFavoriteRoutes(prev => prev.filter(route => route._id !== routeId));
      } else {
        Alert.alert("Error", data.message || "Failed to remove route.");
      }
    } catch (err) {
      Alert.alert("Network Error", "Could not connect to transit server cluster.");
    } finally {
      setIsDeletingId(null);
    }
  };

  const renderRouteCard = ({ item }: { item: any }) => {
    const isDelayed = item.status === 'Delayed';
    const routeTitle = item.route_name || 'Active Route';

    return (
      <TouchableOpacity 
        style={styles.card} 
        activeOpacity={0.7}

        onPress={() => router.push({ pathname: '/(tabs)/index', params: { activeRouteId: item._id } })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <Ionicons name="bus" size={16} color="#196F31" />
            <Text style={styles.routeName}>{routeTitle}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleDelete(item._id, routeTitle)} 
            style={styles.heartBtn}
            disabled={isDeletingId === item._id}
          >
            {isDeletingId === item._id ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Ionicons name="heart" size={22} color="#196F31" />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.pathText}>
          {item.origin || 'Start'} ➔ {item.destination || 'End'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={[styles.statusIndicator, isDelayed && styles.statusDelayedBg]}>
            <Text style={[styles.statusText, isDelayed && styles.statusDelayedText]}>
              {item.status || 'On Time'}
            </Text>
          </View>
          <Text style={styles.etaText}>
            Next Bus: <Text style={styles.etaHighlight}>{item.eta || 'Live Tracking'}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#196F31" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorite Routes</Text>
        <Text style={styles.headerSub}>Quick access to your regular Karachi transits</Text>
      </View>

      {favoriteRoutes.length > 0 ? (
        <FlatList
          data={favoriteRoutes}
          keyExtractor={(item) => item._id}
          renderItem={renderRouteCard}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="heart-outline" size={44} color="#6A8E75" />
          </View>
          <Text style={styles.emptyTitle}>Your shortcuts list is empty</Text>
          <Text style={styles.emptySub}>Save your daily commute lines from the map tracking panel to see them here.</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.replace('/(tabs)/.')}>
            <Text style={styles.actionBtnText}>Explore Live Routes</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F9F4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F9F4' },
  header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 15 },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#123D1F' },
  headerSub: { fontSize: 14, color: '#6A8E75', marginTop: 4 },
  list: { padding: 20, paddingTop: 5, gap: 16 },
  
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E8F3EB',
    elevation: 4,
    shadowColor: '#196F31',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E1F5EE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, gap: 6 },
  routeName: { fontSize: 13, fontWeight: '800', color: '#123D1F' },
  heartBtn: { padding: 4, minWidth: 28, alignItems: 'center' },
  pathText: { fontSize: 17, fontWeight: '800', color: '#000000', marginVertical: 14 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1.5, borderTopColor: '#F0F9F4', paddingTop: 12 },
  statusIndicator: { backgroundColor: '#E1F5EE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#0F6E56' },
  statusDelayedBg: { backgroundColor: '#FFF3E0' },
  statusDelayedText: { color: '#E65100' },
  
  etaText: { fontSize: 13, color: '#6A8E75', fontWeight: '600' },
  etaHighlight: { color: '#196F31', fontWeight: '900', fontSize: 14 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 12, marginBottom: 80 },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F3EB', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 19, fontWeight: '800', color: '#123D1F' },
  emptySub: { fontSize: 14, color: '#6A8E75', textAlign: 'center', lineHeight: 22 },
  actionBtn: { backgroundColor: '#196F31', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 10, elevation: 2 },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 }
});