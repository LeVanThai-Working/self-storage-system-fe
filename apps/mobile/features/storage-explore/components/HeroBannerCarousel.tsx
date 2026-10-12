import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Image,
  Pressable,
  ScrollView,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  type LayoutChangeEvent,
} from "react-native";
import { ShieldCheck, Boxes, Sparkles } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { useTranslation } from "@/stores/language.store";

interface BannerSlide {
  id: string;
  imageUri: string;
  badgeKey: string;
  titleKey: string;
  subtitleKey: string;
  accentBgClass: string;
  icon: "shield" | "boxes" | "sparkles";
}

const BANNER_SLIDES: BannerSlide[] = [
  {
    id: "banner-1",
    imageUri:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80",
    badgeKey: "storageExplore.banner1Badge",
    titleKey: "storageExplore.banner1Title",
    subtitleKey: "storageExplore.banner1Subtitle",
    accentBgClass: "bg-brand-dark",
    icon: "shield",
  },
  {
    id: "banner-2",
    imageUri:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1000&q=80",
    badgeKey: "storageExplore.banner2Badge",
    titleKey: "storageExplore.banner2Title",
    subtitleKey: "storageExplore.banner2Subtitle",
    accentBgClass: "bg-neutral-900",
    icon: "boxes",
  },
  {
    id: "banner-3",
    imageUri:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
    badgeKey: "storageExplore.banner3Badge",
    titleKey: "storageExplore.banner3Title",
    subtitleKey: "storageExplore.banner3Subtitle",
    accentBgClass: "bg-brand-active",
    icon: "sparkles",
  },
];

const AUTO_SLIDE_INTERVAL_MS = 10000; // 10 seconds

export function HeroBannerCarousel() {
  const { t } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [bannerWidth, setBannerWidth] = useState<number>(
    Math.max(Dimensions.get("window").width - 32, 280)
  );
  const isUserDraggingRef = useRef<boolean>(false);

  const scrollToSlide = useCallback(
    (index: number) => {
      setActiveIndex(index);
      if (bannerWidth > 0) {
        scrollViewRef.current?.scrollTo({
          x: index * bannerWidth,
          animated: true,
        });
      }
    },
    [bannerWidth]
  );

  // Auto-advance banner every 10 seconds when user is not actively dragging
  useEffect(() => {
    const timer = setInterval(() => {
      if (isUserDraggingRef.current) return;
      const nextIndex = (activeIndex + 1) % BANNER_SLIDES.length;
      scrollToSlide(nextIndex);
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeIndex, scrollToSlide]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = Math.round(event.nativeEvent.layout.width);
    if (width > 0 && width !== bannerWidth) {
      setBannerWidth(width);
    }
  };

  const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserDraggingRef.current = false;
    if (bannerWidth <= 0) return;
    const offsetX = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offsetX / bannerWidth);
    if (nextIndex >= 0 && nextIndex < BANNER_SLIDES.length && nextIndex !== activeIndex) {
      setActiveIndex(nextIndex);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      className="relative mb-4 overflow-hidden rounded-3xl border border-neutral-border dark:border-neutral-800 shadow-sm"
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          isUserDraggingRef.current = true;
        }}
        onScrollEndDrag={() => {
          isUserDraggingRef.current = false;
        }}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      >
        {BANNER_SLIDES.map((slide, idx) => (
          <View
            key={slide.id}
            style={{ width: bannerWidth, height: 184 }}
            className={`relative overflow-hidden ${slide.accentBgClass}`}
          >
            {/* Background Banner Image filling 100% of frame */}
            <Image
              source={{ uri: slide.imageUri }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: bannerWidth,
                height: 184,
              }}
              resizeMode="cover"
            />

            {/* Dark contrast overlay so white text & badges remain crisp */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              className="bg-black/45"
            />

            {/* Foreground Padded Content */}
            <View className="flex-1 justify-between p-5">
              {/* Top Badge & Slide Counter */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 rounded-full bg-white/20 px-3 py-1">
                  {slide.icon === "shield" && <ShieldCheck size={13} color="#FFFFFF" />}
                  {slide.icon === "boxes" && <Boxes size={13} color="#FFFFFF" />}
                  {slide.icon === "sparkles" && <Sparkles size={13} color="#FFFFFF" />}
                  <Text className="text-xs font-bold text-white">{t(slide.badgeKey)}</Text>
                </View>

                <View className="rounded-full bg-black/35 px-2.5 py-0.5">
                  <Text className="text-[11px] font-semibold text-white/95">
                    {idx + 1}/{BANNER_SLIDES.length}
                  </Text>
                </View>
              </View>

              {/* Bottom Title & Subtitle */}
              <View className="pb-4">
                <Text numberOfLines={2} className="text-lg font-extrabold leading-6 text-white">
                  {t(slide.titleKey)}
                </Text>
                <Text numberOfLines={2} className="mt-1 text-xs leading-4 text-white/90">
                  {t(slide.subtitleKey)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Indicator Dots (Tappable + Synced with Swipe & Auto-Slide) */}
      <View className="absolute bottom-3.5 left-5 flex-row items-center gap-1.5">
        {BANNER_SLIDES.map((slide, idx) => {
          const isActive = idx === activeIndex;
          return (
            <Pressable
              key={slide.id}
              onPress={() => scrollToSlide(idx)}
              hitSlop={8}
              className={`h-1.5 rounded-full ${isActive ? "w-6 bg-cta" : "w-2 bg-white/50"}`}
            />
          );
        })}
      </View>
    </View>
  );
}
