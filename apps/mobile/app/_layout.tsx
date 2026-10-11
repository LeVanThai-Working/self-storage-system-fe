import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";

import { PortalHost } from "@rn-primitives/portal";
import { useColorScheme } from "nativewind";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/stores/auth.store";
import { useReservationHandoffStore } from "@/features/storage-explore/stores/reservationHandoff.store";
import { GlobalToast } from "@/components/ui/toast";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent splash screen from auto-hiding until assets and session are ready
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isInitializing, initAuth } = useAuthStore();
  const consumePendingRedirect = useReservationHandoffStore((s) => s.consumePendingRedirect);

  // Restore authenticated session from SecureStore on startup
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Hide splash screen once font and auth initialization are resolved
  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitializing]);

  // Auth Guard: allow public storage lookup (Explore tab & Facility Detail), protect customer-only routes
  useEffect(() => {
    if (isInitializing) return;

    const firstSegment = segments[0] as string | undefined;
    const secondSegment = segments[1] as string | undefined;

    const inAuthGroup = firstSegment === "(auth)";
    const inPublicFacilityDetail = firstSegment === "facilities";
    const inPublicExploreTab =
      !firstSegment || (firstSegment === "(tabs)" && (!secondSegment || secondSegment === "index"));

    const isPublicRoute = inAuthGroup || inPublicFacilityDetail || inPublicExploreTab;

    if (!isAuthenticated && !isPublicRoute) {
      // Unauthenticated user attempting to access protected customer route
      router.replace("/(auth)/login" as any);
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated user on auth screen -> check if there is a pending reservation handoff
      if (consumePendingRedirect()) {
        router.replace("/(tabs)/reservations" as any);
      } else {
        router.replace("/(tabs)" as any);
      }
    }
  }, [isAuthenticated, isInitializing, segments, router, consumePendingRedirect]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="facilities/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
      {/* Global floating toast notification overlay */}
      <GlobalToast />
      {/* Required by RNR for overlay components (Dropdown, Dialog, Tooltip…) */}
      <PortalHost />
    </ThemeProvider>
  );
}
