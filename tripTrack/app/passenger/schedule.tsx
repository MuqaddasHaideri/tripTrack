import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { fetchRoutesApi } from '../../service/server';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SchedulesScreen() {
  const [expandedRouteId, setExpandedRouteId] = useState<string | null>(null);

  const { data: routes, isLoading, refetch } = useQuery({
    queryKey: ['routes', 'all'],
    queryFn: fetchRoutesApi,
  });

  const toggleExpand = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRouteId(expandedRouteId === id ? null : id);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00C853" />
        <Text style={styles.loadingText}>Loading Schedules...</Text>
      </View>
    );
  }

  const renderRouteItem = ({ item }: { item: any }) => {
    const isExpanded = expandedRouteId === item._id;
    const routeColor = item.color_hex || '#00C853';

    return (
      <View style={styles.routeCard}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleExpand(item._id)}
          activeOpacity={0.7}
        >
          <View style={[styles.busIconContainer, { backgroundColor: routeColor }]}>
            <Ionicons name="bus" size={24} color="white" />
          </View>
          
          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{item.route_name || 'Bus Route'}</Text>
            <Text style={styles.routePath}>{item.origin} ➔ {item.destination}</Text>
          </View>

          <View style={styles.expandIconBox}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#81C784" 
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.stopsContainer}>
            <View style={styles.verticalLine} />
            {item.stops?.map((stop: any, index: number) => (
              <View key={index} style={styles.stopRow}>
                <View style={[styles.stopDot, { borderColor: routeColor }]} />
                <Text style={styles.stopName}>{stop.stop_name || stop.name}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bus Schedules</Text>
        <Text style={styles.headerSubtitle}>Explore available routes and their stops</Text>
      </View>

      <FlatList
        data={routes}
        keyExtractor={(item) => item._id}
        renderItem={renderRouteItem}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No schedules available right now.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#021a11',
  },
  center: {
    flex: 1,
    backgroundColor: '#021a11',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#81C784',
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#81C784',
    marginTop: 4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  routeCard: {
    backgroundColor: '#0A2E1F',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#021a11',
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  busIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
    marginLeft: 15,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  routePath: {
    fontSize: 13,
    color: '#81C784',
    marginTop: 2,
  },
  expandIconBox: {
    padding: 4,
  },
  stopsContainer: {
    paddingLeft: 70, 
    paddingBottom: 20,
    paddingRight: 20,
  },
  verticalLine: {
    position: 'absolute',
    left: 77,
    top: 0,
    bottom: 30,
    width: 2,
    backgroundColor: '#021a11',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stopDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    backgroundColor: '#0A2E1F',
    marginRight: 12,
    zIndex: 1,
  },
  stopName: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#81C784',
    marginTop: 50,
  }
});