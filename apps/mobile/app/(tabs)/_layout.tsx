import { Tabs } from "expo-router";
import { Search, CalendarCheck, Package, CreditCard, Headphones } from "lucide-react-native";
import { SettingsButton } from "@/features/auth/components/SettingsButton";
import { useColorScheme } from "nativewind";
import { useTranslation } from "@/stores/language.store";

const BRAND = "#0B927E";
const MUTED = "#647B80";

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const { t } = useTranslation();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          backgroundColor: isDark ? "#171717" : "#FFFFFF",
          borderTopColor: isDark ? "#262626" : "#E1E8E8",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: isDark ? "#171717" : "#F8FAF9",
          borderBottomColor: isDark ? "#262626" : "#E1E8E8",
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontWeight: "700",
          color: isDark ? "#F5F5F5" : "#173A3A",
          fontSize: 16,
        },
        headerRight: () => <SettingsButton />,
      }}
    >
      {/* 1. Explore & Search Storages */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("customerTabs.exploreTitle"),
          tabBarLabel: t("customerTabs.explore"),
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />

      {/* 2. Storage Reservations */}
      <Tabs.Screen
        name="reservations"
        options={{
          title: t("customerTabs.reservationTitle"),
          tabBarLabel: t("customerTabs.reservation"),
          tabBarIcon: ({ color, size }) => <CalendarCheck size={size} color={color} />,
        }}
      />

      {/* 3. My Active Storages & Self Check-in */}
      <Tabs.Screen
        name="my-storages"
        options={{
          title: t("customerTabs.myUnitsTitle"),
          tabBarLabel: t("customerTabs.myUnits"),
          tabBarIcon: ({ color, size }) => <Package size={size} color={color} />,
        }}
      />

      {/* 4. Invoices & Payments */}
      <Tabs.Screen
        name="payments"
        options={{
          title: t("customerTabs.paymentsTitle"),
          tabBarLabel: t("customerTabs.payments"),
          tabBarIcon: ({ color, size }) => <CreditCard size={size} color={color} />,
        }}
      />

      {/* 5. Support & Helpdesk */}
      <Tabs.Screen
        name="support"
        options={{
          title: t("customerTabs.supportTitle"),
          tabBarLabel: t("customerTabs.support"),
          tabBarIcon: ({ color, size }) => <Headphones size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
