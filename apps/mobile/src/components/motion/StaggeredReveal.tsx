import React, { useEffect, useRef } from 'react';
import { View, ViewStyle, StyleProp, Animated, Easing } from 'react-native';

interface StaggeredRevealProps {
  /** Children to stagger. Each direct child animates in sequence. */
  children: React.ReactNode;
  /** Delay between each child's entrance (ms) */
  staggerInterval?: number;
  /** Duration of each child's animation (ms) */
  duration?: number;
  /** Initial delay before first child starts (ms) */
  initialDelay?: number;
  /** Animation direction */
  direction?: 'down' | 'up' | 'left' | 'right';
  /** Translation distance (px) */
  distance?: number;
  /** Whether reveal is active */
  visible?: boolean;
  /** Container style */
  style?: StyleProp<ViewStyle>;
}

/**
 * Container that staggers children entrance with fade + slide.
 * Uses RN Animated with native driver for zero JS-thread cost.
 *
 * Replaces manual stagger logic in DemoModeView AnimatedMetricItem.
 * Used everywhere: metric panels, card lists, onboarding steps, timeline items.
 */
export function StaggeredReveal({
  children,
  staggerInterval = 80,
  duration = 500,
  initialDelay = 0,
  direction = 'down',
  distance = 20,
  visible = true,
  style,
}: StaggeredRevealProps) {
  const childArray = React.Children.toArray(children);
  const animations = useRef(
    childArray.map(() => ({
      opacity: new Animated.Value(0),
      translate: new Animated.Value(getInitialTranslate(direction, distance)),
    })),
  ).current;

  // Ensure we have enough animation values for children
  while (animations.length < childArray.length) {
    animations.push({
      opacity: new Animated.Value(0),
      translate: new Animated.Value(getInitialTranslate(direction, distance)),
    });
  }

  useEffect(() => {
    if (visible) {
      const anims = childArray.map((_, i) => {
        const delay = initialDelay + i * staggerInterval;
        return Animated.parallel([
          Animated.timing(animations[i].opacity, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(animations[i].translate, {
            toValue: 0,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
      });
      Animated.parallel(anims).start();
    } else {
      // Reset all
      animations.forEach((anim) => {
        anim.opacity.setValue(0);
        anim.translate.setValue(getInitialTranslate(direction, distance));
      });
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const isVertical = direction === 'up' || direction === 'down';

  return (
    <View style={style}>
      {childArray.map((child, i) => (
        <Animated.View
          key={i}
          style={{
            opacity: animations[i].opacity,
            transform: isVertical
              ? [{ translateY: animations[i].translate }]
              : [{ translateX: animations[i].translate }],
          }}
        >
          {child}
        </Animated.View>
      ))}
    </View>
  );
}

function getInitialTranslate(direction: string, distance: number): number {
  switch (direction) {
    case 'up': return distance;
    case 'down': return -distance;
    case 'left': return distance;
    case 'right': return -distance;
    default: return -distance;
  }
}

