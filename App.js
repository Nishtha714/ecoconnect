import { useState } from "react";
import { Text, View, Button } from "react-native";
import { addUser } from "./eco-connect/services/api";

export default function App() {
  const [response, setResponse] = useState("");

  const handleAddUser = async () => {
    const data = {
      name: "App User",
      email: "app@gmail.com",
    };

    const res = await addUser(data);
    setResponse(res.message);
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Ecoconnect 🌱</Text>
      <Button title="Add User" onPress={handleAddUser} />
      <Text>{response}</Text>
    </View>
  );
}



