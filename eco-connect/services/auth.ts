import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type StoredUser = {
  user_id: string;
  name:    string;
  email:   string;
  role:    "freelancer" | "client" | "admin";
};

export const clearUser = async () => {
  await AsyncStorage.removeItem("user");
  await AsyncStorage.removeItem("token");
};

export const getStoredUser = async (): Promise<StoredUser | null> => {
  const u = await AsyncStorage.getItem("user");
  return u ? JSON.parse(u) : null;
};

export const getToken = async (): Promise<string | null> =>
  AsyncStorage.getItem("token");

export const saveToken = async (token: string) =>
  AsyncStorage.setItem("token", token);

export const saveUser = async (user: StoredUser) =>
  AsyncStorage.setItem("user", JSON.stringify(user));

// Aliases used by register.tsx — point to the same functions above
export const storeToken = saveToken;
export const storeUser  = saveUser;

export const logout = async () => {
  await AsyncStorage.multiRemove(["token", "user"]);
};

// Guards disabled — all pages accessible
export function useGuard(_role: string = "any") {
  const [user, setUser] = useState<StoredUser | null>(null);
  useEffect(() => { getStoredUser().then(setUser); }, []);
  return { user, ready: true };
}