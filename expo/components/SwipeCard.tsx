import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Briefcase, BadgeCheck, X, Heart, Star } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Profile } from '@/mocks/profiles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.62;

interface SwipeCardProps {
  profile: Profile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSuperLike: () => void;
  isFirst: boolean;
}

export default function SwipeCard({ profile, onSwipeLeft, onSwipeRight, onSuperLike, isFirst }: SwipeCardProps) {
  const position = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(isFirst ? 1 : 0.95)).current;

  React.useEffect(() => {
    if (isFirst) {
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }).start();
    }
  }, [isFirst]);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [position]);

  const swipeOffScreen = useCallback((direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      if (direction === 'right') {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    });
  }, [position, onSwipeLeft, onSwipeRight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isFirst,
      onMoveShouldSetPanResponder: (_, gesture) => {
        return isFirst && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5);
      },
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.5 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOffScreen('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOffScreen('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const handleLike = useCallback(() => {
    swipeOffScreen('right');
  }, [swipeOffScreen]);

  const handleNope = useCallback(() => {
    swipeOffScreen('left');
  }, [swipeOffScreen]);

  const handleSuperLike = useCallback(() => {
    Animated.timing(position, {
      toValue: { x: 0, y: -SCREEN_HEIGHT },
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onSuperLike();
    });
  }, [position, onSuperLike]);

  const animatedStyle = isFirst
    ? {
        transform: [
          ...position.getTranslateTransform(),
          { rotate },
          { scale },
        ],
      }
    : {
        transform: [{ scale }],
      };

  return (
    <Animated.View
      style={[styles.card, animatedStyle]}
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      <Image
        source={{ uri: profile.photos[0] }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.gradient}>
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.age}>{profile.age}</Text>
            {profile.verified && (
              <BadgeCheck size={20} color={Colors.superLike} fill={Colors.superLike} />
            )}
          </View>
          <View style={styles.clanRow}>
            <Text style={styles.clan}>{profile.clan} Clan</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={14} color="rgba(255,255,255,0.8)" />
            <Text style={styles.detailText}>{profile.location} · {profile.distance}</Text>
          </View>
          <View style={styles.interestsRow}>
            {profile.interests.slice(0, 3).map((interest) => (
              <View key={interest} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {isFirst && (
        <>
          <Animated.View style={[styles.stampContainer, styles.likeStamp, { opacity: likeOpacity }]}>
            <Text style={styles.likeText}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stampContainer, styles.nopeStamp, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeText}>NOPE</Text>
          </Animated.View>
        </>
      )}

      {isFirst && (
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.nopeButton]}
            onPress={handleNope}
            activeOpacity={0.8}
            testID="nope-button"
          >
            <X size={28} color={Colors.nope} strokeWidth={3} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={handleSuperLike}
            activeOpacity={0.8}
            testID="superlike-button"
          >
            <Star size={24} color={Colors.superLike} strokeWidth={3} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={handleLike}
            activeOpacity={0.8}
            testID="like-button"
          >
            <Heart size={28} color={Colors.like} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: Colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
  },
  infoContainer: {
    padding: 20,
    paddingBottom: 70,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  age: {
    fontSize: 24,
    fontWeight: '400' as const,
    color: 'rgba(255,255,255,0.9)',
  },
  clanRow: {
    marginTop: 4,
  },
  clan: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.accentLight,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  detailText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  interestsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500' as const,
  },
  stampContainer: {
    position: 'absolute',
    top: 50,
    padding: 10,
    borderWidth: 4,
    borderRadius: 8,
  },
  likeStamp: {
    left: 20,
    borderColor: Colors.like,
    transform: [{ rotate: '-15deg' }],
  },
  nopeStamp: {
    right: 20,
    borderColor: Colors.nope,
    transform: [{ rotate: '15deg' }],
  },
  likeText: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.like,
  },
  nopeText: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.nope,
  },
  buttonsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  nopeButton: {},
  superLikeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  likeButton: {},
});
