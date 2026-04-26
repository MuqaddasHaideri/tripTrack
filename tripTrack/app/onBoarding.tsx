import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// Fonts
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium } from '@expo-google-fonts/inter';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'LOCATE STOPS',
    description: 'TripTrack finds all nearby buses and stops for you instantly.',
    image: require('../assets/images/Bus Stop.gif'),
  },
  {
    id: '2',
    title: 'REAL-TIME TRACKING',
    description: 'Never miss a bus again. Track its precise location on the map.',
    image: require('../assets/images/city bus.gif'),
  },
  {
    id: '3',
    title: 'SAVE FAVOURITES',
    description: 'Bookmark your frequent stops and routes for one-tap access.',
    image: require('../assets/images/Location review.gif'),
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
  });

  if (!fontsLoaded) return null;

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      router.push('/(auth)/login');
    }
  };

  const skipOnboarding = () => {
    router.push('/(auth)/login');
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width
    ];

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp'
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [40, 0, 40],
      extrapolate: 'clamp'
    });

    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </View>

        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity,
              transform: [{ translateY }]
            }
          ]}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.skipBtn} onPress={skipOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* SLIDES */}
      <Animated.FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.bottomContainer}>

        <View style={styles.pagination}>
          {slides.map((_, i) => {
            const inputRange = [
              (i - 1) * width,
              i * width,
              (i + 1) * width
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [1, 2.5, 1],
              extrapolate: 'clamp'
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp'
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    transform: [{ scaleX: scale }],
                    opacity,
                  }
                ]}
              />
            );
          })}
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    height: 50,
  },

  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
  },

  skipText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: '#000000',
  },

  slide: {
    width,
    alignItems: 'center',
    padding: 20,
  },

  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    width: '100%',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    paddingTop: 20,
  },

  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#021a11',
    marginBottom: 16,
    textAlign: 'center',
  },

  description: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    color: '#1b421d',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },

  bottomContainer: {
    position: 'absolute',
    bottom: 25,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  pagination: {
    flexDirection: 'row',
    marginBottom: 15,
  },

  dot: {
    width: 5,
    height: 8,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#196F31',
  },
  nextButton: {
    width: '100%',
    backgroundColor: '#196F31',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  nextText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
});