import { Tabs } from "expo-router";
import { Home, CalendarCheck, Package, CreditCard, Headphones } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useTranslation } from "@/stores/language.store";
import { CustomerTabHeader } from "@/features/storage-explore/components/CustomerTabHeader";

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
        header: () => <CustomerTabHeader isHome={false} />,
      }}
    >
      {/* 1. Home (Explore & Search Storages) */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("customerTabs.exploreTitle"),
          tabBarLabel: t("customerTabs.explore"),
          header: () => <CustomerTabHeader isHome={true} />,
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
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
