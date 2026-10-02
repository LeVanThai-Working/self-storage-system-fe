import { ScrollView, View, Alert } from "react-native";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text variant="title" className="mb-3">
        {title}
      </Text>
      <Separator className="mb-4" />
      {children}
    </View>
  );
}

export default function FormsScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorEmail, setErrorEmail] = useState(false);
  const [search, setSearch] = useState("");

  const handleSubmit = () => {
    if (!email.includes("@")) {
      setErrorEmail(true);
      return;
    }
    setErrorEmail(false);
    Alert.alert("Submitted", `Email: ${email}`);
  };

  return (
    <ScrollView className="flex-1 bg-neutral-bg" contentContainerClassName="px-4 py-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <Text variant="heading2" className="mb-1">
        Form Controls
      </Text>
      <Text variant="muted" className="mb-8">
        Input, Label and form composition patterns.
      </Text>

      {/* ── Basic Inputs ──────────────────────────────────────── */}
      <Section title="Basic Inputs">
        <View className="gap-4">
          <View className="gap-1.5">
            <Label>Full name</Label>
            <Input placeholder="John Doe" />
          </View>

          <View className="gap-1.5">
            <Label>Search</Label>
            <Input
              placeholder="Search storages…"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>

          <View className="gap-1.5">
            <Label disabled>Disabled field</Label>
            <Input placeholder="Cannot type here" editable={false} className="opacity-50" />
          </View>
        </View>
      </Section>

      {/* ── Validation States ─────────────────────────────────── */}
      <Section title="Validation States">
        <View className="gap-4">
          <View className="gap-1.5">
            <Label required error={errorEmail}>
              Email address
            </Label>
            <Input
              placeholder="you@example.com"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setErrorEmail(false);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errorEmail}
            />
            {errorEmail && <Text variant="error">Please enter a valid email address.</Text>}
          </View>

          <View className="gap-1.5">
            <Label required>Password</Label>
            <Input
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>
      </Section>

      {/* ── Complete Login Form ───────────────────────────────── */}
      <Section title="Login Form Composition">
        <View className="gap-4 rounded-xl border border-neutral-border bg-white p-5">
          <View>
            <Text variant="heading3" className="mb-0.5">
              Welcome back
            </Text>
            <Text variant="muted">Sign in to StorageHub</Text>
          </View>

          <View className="gap-1.5">
            <Label required>Email</Label>
            <Input
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View className="gap-1.5">
            <Label required>Password</Label>
            <Input placeholder="••••••••" secureTextEntry />
          </View>

          <Button
            variant="primary"
            size="lg"
            label="Sign In"
            onPress={handleSubmit}
            className="mt-2"
          />

          <Button variant="ghost" label="Forgot password?" onPress={() => {}} />
        </View>
      </Section>
    </ScrollView>
  );
}
