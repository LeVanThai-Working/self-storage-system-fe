import { Tabs } from "expo-router";
import { LayoutGrid, PencilLine, Layers } from "lucide-react-native";

const BRAND = "#0B927E";
const MUTED = "#647B80";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E1E8E8",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        headerStyle: {
          backgroundColor: "#F8FAF9",
          borderBottomColor: "#E1E8E8",
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontWeight: "700",
          color: "#173A3A",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Buttons & Badges",
          tabBarLabel: "Buttons",
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="forms"
        options={{
          title: "Form Controls",
          tabBarLabel: "Forms",
          tabBarIcon: ({ color, size }) => <PencilLine size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="layout"
        options={{
          title: "Layout & Data",
          tabBarLabel: "Layout",
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
