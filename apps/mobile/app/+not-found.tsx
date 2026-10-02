import { Link, Stack } from "expo-router";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 items-center justify-center bg-neutral-bg p-5">
        <Text variant="heading3" className="mb-2 text-center">
          This screen doesn&apos;t exist.
        </Text>
        <Text variant="muted" className="mb-6 text-center">
          The page you&apos;re looking for couldn&apos;t be found.
        </Text>
        <Link href="/" className="py-4">
          <Text variant="link">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
