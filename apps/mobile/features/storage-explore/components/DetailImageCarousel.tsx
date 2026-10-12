import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Image,
  ScrollView,
  Pressable,
  Dimensions,
  type LayoutChangeEvent,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { Building2, Boxes, ImageIcon } from "lucide-react-native";
import { Text } from "@/components/ui/text";

interface DetailImageCarouselProps {
  images?: (string | null | undefined)[] | null;
  fallbackIcon?: "facility" | "unitType";
  fallbackLabel?: string;
  height?: number;
}

export function DetailImageCarousel({
  images,
  fallbackIcon = "facility",
  fallbackLabel,
  height = 216,
}: DetailImageCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [carouselWidth, setCarouselWidth] = useState<number>(
    Math.max(Dimensions.get("window").width - 32, 280)
  );

  const validImages = (images ?? []).filter(
    (img): img is string => typeof img === "string" && img.trim().length > 0
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    if (width > 0 && width !== carouselWidth) {
      setCarouselWidth(width);
    }
  };

  const scrollToSlide = useCallback(
    (index: number) => {
      setActiveIndex(index);
      if (carouselWidth > 0) {
        scrollViewRef.current?.scrollTo({
          x: index * carouselWidth,
          animated: true,
        });
      }
    },
    [carouselWidth]
  );

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (carouselWidth <= 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / carouselWidth);
    if (nextIndex >= 0 && nextIndex < validImages.length && nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  if (validImages.length === 0) {
    return (
      <View
        onLayout={handleLayout}
        style={{ height }}
        className="relative w-full items-center justify-center overflow-hidden rounded-3xl border border-neutral-border dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
      >
        <View className="items-center justify-center gap-2">
          <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-light/70 dark:bg-brand/20">
            {fallbackIcon === "facility" ? (
              <Building2 size={28} color="#0B927E" />
            ) : fallbackIcon === "unitType" ? (
              <Boxes size={28} color="#0B927E" />
            ) : (
              <ImageIcon size={28} color="#0B927E" />
            )}
          </View>
          {fallbackLabel ? (
            <Text variant="muted" className="text-xs font-medium">
              {fallbackLabel}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View
      onLayout={handleLayout}
      style={{ height }}
      className="relative w-full overflow-hidden rounded-3xl border border-neutral-border dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {validImages.map((uri, idx) => (
          <View key={`carousel-img-${idx}`} style={{ width: carouselWidth, height }}>
            <Image source={{ uri }} style={{ width: carouselWidth, height }} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      {/* Slide Counter Badge */}
      <View className="absolute right-3.5 top-3.5 rounded-full bg-black/50 px-2.5 py-1">
        <Text className="text-[11px] font-bold text-white">
          {activeIndex + 1}/{validImages.length}
        </Text>
      </View>

      {/* Indicator Dots */}
      {validImages.length > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-1.5">
          {validImages.map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <Pressable
                key={`carousel-dot-${idx}`}
                onPress={() => scrollToSlide(idx)}
                hitSlop={8}
                className={`h-1.5 rounded-full ${isActive ? "w-5 bg-cta" : "w-1.5 bg-white/70"}`}
              />
            );
          })}
        </View>
      )}
    </View>
  );
}
