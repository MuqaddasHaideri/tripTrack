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
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchRoutesApi } from '../../service/server';
import { useTranslation } from 'react-i18next';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SchedulesScreen() {
       const { t } = useTranslation();
    
  const router = useRouter();
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
        <ActivityIndicator size="large" color="#196F31" />
        <Text style={styles.loadingText}>{t("schedules.loading")}</Text>
      </View>
    );
  }

  const renderRouteItem = ({ item }: { item: any }) => {
    const isExpanded = expandedRouteId === item._id;
    const routeColor = item.color_hex || '#196F31';

    return (
      <View style={[styles.routeCard, isExpanded && styles.expandedCard]}>
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => toggleExpand(item._id)}
          activeOpacity={0.7}
        >
          <View style={[styles.busIconContainer, { backgroundColor: routeColor }]}>
            <Ionicons name="bus" size={24} color="white" />
          </View>

          <View style={styles.routeInfo}>
            <Text style={styles.routeName}>{item.route_name || t("schedules.busRoute")}</Text>
            <Text style={styles.routePath}>{item.origin} ➔ {item.destination}</Text>
          </View>

          <View style={[styles.expandIconBox, isExpanded && { transform: [{ rotate: '180deg' }] }]}>
            <Ionicons name="chevron-down" size={22} color="#196F31" />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.stopsContainer}>
            <View style={styles.verticalLine} />
            {item.stops?.map((stop: any, index: number) => (
              <View key={index} style={styles.stopRow}>
                <View style={[styles.stopDot, { borderColor: routeColor }]} />
                <View style={styles.stopTextContainer}>
                  <Text style={styles.stopName}>{stop.stop_name || stop.name}</Text>
                  <Text style={styles.stopStatus}>{t("schedules.scheduledStop")}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>{t("schedules.title")}</Text>
          <Text style={styles.headerSubtitle}>{t("schedules.subtitle")}</Text>
        </View>
      </View>

      <FlatList
        data={routes}
        keyExtractor={(item) => item._id}
        renderItem={renderRouteItem}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("schedules.empty")}</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F9F4', 
  },
  center: {
    flex: 1,
    backgroundColor: '#F0F9F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#196F31',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    letterSpacing: -0.5,
    marginTop:10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93', // Gray
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#196F31', // Dark Green Border
    elevation: 4,
    shadowColor: '#196F31',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  expandedCard: {
    borderColor: '#196F31',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  busIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  routeName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  routePath: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    fontWeight: '600',
  },
  expandIconBox: {
    padding: 4,
  },
  stopsContainer: {
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 24,
    paddingTop: 10,
  },
  verticalLine: {
    position: 'absolute',
    left: 31,
    top: 0,
    bottom: 40,
    width: 2,
    backgroundColor: '#E8F3EB',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  stopDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    backgroundColor: 'white',
    marginRight: 16,
    zIndex: 1,
    marginTop: 2,
  },
  stopTextContainer: {
    flex: 1,
  },
  stopName: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  stopStatus: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    marginTop: 50,
    fontSize: 15,
    fontWeight: '600',
  }
});