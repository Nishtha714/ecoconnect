import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getStoredUser, StoredUser } from "@/services/auth";
import { BottomTabBar } from '@react-navigation/bottom-tabs';
export default function TabLayout() {
  const [user, setUser] = useState<StoredUser | null | "loading">("loading");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getStoredUser().then(setUser);
  }, []);

  if (user === "loading") return null;

  const role       = (user as StoredUser | null)?.role ?? "public";
  const isAdmin      = role === "admin";
  const isFreelancer = role === "freelancer";
  const isClient     = role === "client";
  const isLoggedIn   = isAdmin || isFreelancer || isClient;

  const bottomPad = Platform.OS === "android"
    ? Math.max(insets.bottom, 8)
    : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#639922",
        tabBarButton: HapticTab,
        tabBarStyle: isLoggedIn ? {
          backgroundColor: "#fff",
          borderTopColor: "#e0e8d8",
          borderTopWidth: 0.5,
          height: 60 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        } : { display: "none",
          height:0,
          overflow:"hidden",
         },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
        tabBar={(props) => Platform.OS === 'web' ? null : <BottomTabBar {...props} />}

    >
      {/* HOME — hidden from tab bar always, accessible as root route */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          href: null,             // ← removed from tab bar
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="house.fill" color={color} />
          ),
        }}
      />

      {/* PROJECTS — admin only */}
<Tabs.Screen
  name="projects"
  options={{
    title: "Projects",
    href: isAdmin ? undefined : null,  // ← bas yahi badlo
    tabBarIcon: ({ color }) => (
      <IconSymbol size={24} name="folder.fill" color={color} />
    ),
  }}
/>

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          href: isLoggedIn ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="person.fill" color={color} />
          ),
        }}
      />

      {/* COURSES */}
      <Tabs.Screen
        name="courses"
        options={{
          title: "Courses",
          href: isLoggedIn ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="book.fill" color={color} />
          ),
        }}
      />

      {/* DASHBOARD — admin only */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} name="chart.bar.fill" color={color} />
          ),
        }}
      />

      {/* HIDDEN */}
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
