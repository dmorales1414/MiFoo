import { useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
} from 'react-native';

import { styles } from '../styles/recommendedMealCarousel.styles';
import type { Meal } from '../types/item';

interface RecommendedMealCarouselProps {
  meals: Meal[];
  label?: string;
  onPressMeal?: (id: string) => void;
  /** Shown as a single card when there are no meals yet. Tapping it calls onPressEmpty. */
  emptyText?: string;
  onPressEmpty?: () => void;
}

// Tweak these to change how the carousel looks.
const CARD_WIDTH_RATIO = 0.56; // card width as a fraction of the screen width
const CARD_ASPECT_RATIO = 1.5; // width / height
const SIDE_SCALE = 0.85; // size of the cards next to the centered one
const SIDE_OPACITY = 0.6;

// Horizontal, snapping carousel. The card in the middle is full size; the ones
// beside it shrink and fade, driven by how far the list has been scrolled.
export function RecommendedMealCarousel({
  meals,
  label = 'Recommended Meal',
  onPressMeal,
  emptyText,
  onPressEmpty,
}: RecommendedMealCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width * CARD_WIDTH_RATIO;
  const cardHeight = cardWidth / CARD_ASPECT_RATIO;
  const sideSpacer = (width - cardWidth) / 2; // lets the first and last cards sit in the center

  // scrollX holds the list's horizontal scroll offset; the cards interpolate from it.
  const scrollX = useRef(new Animated.Value(0)).current;

  const renderItem = ({ item, index }: ListRenderItemInfo<Meal>) => {
    const inputRange = [(index - 1) * cardWidth, index * cardWidth, (index + 1) * cardWidth];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_SCALE, 1, SIDE_SCALE],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_OPACITY, 1, SIDE_OPACITY],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.card,
          { width: cardWidth, height: cardHeight, opacity, transform: [{ scale }] },
        ]}
      >
        <Pressable
          style={styles.image}
          onPress={() => onPressMeal?.(item.id)}
          disabled={!onPressMeal}
          accessibilityRole="button"
          accessibilityLabel={item.title}
        >
          {item.image ? (
            <Image source={item.image} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]} />
          )}
          {item.note || item.title ? (
            <View style={styles.cardCaption}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {item.note ? (
                <Text style={styles.cardNote} numberOfLines={1}>
                  {item.note}
                </Text>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  };

  if (meals.length === 0 && emptyText) {
    return (
      <View style={styles.container}>
        <Pressable
          style={[styles.card, styles.emptyCard, { width: cardWidth, height: cardHeight }]}
          onPress={onPressEmpty}
          accessibilityRole="button"
          accessibilityLabel={emptyText}
        >
          <Text style={styles.emptyCardText}>{emptyText}</Text>
        </Pressable>
        <Text style={styles.label}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.FlatList
        data={meals}
        keyExtractor={(meal: Meal) => meal.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={{ paddingHorizontal: sideSpacer }}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: true,
        })}
      />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
