import { ScrollView, View, Alert } from "react-native";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { Separator } from "@/components/ui/separator";

// ── Demo Section wrapper ──────────────────────────────────────────────
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

export default function ButtonsBadgesScreen() {
  return (
    <ScrollView className="flex-1 bg-neutral-bg" contentContainerClassName="px-4 py-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <Text variant="heading2" className="mb-1">
        Buttons & Badges
      </Text>
      <Text variant="muted" className="mb-8">
        Base UI components mirroring the web design system.
      </Text>

      {/* ── Button Variants ──────────────────────────────────── */}
      <Section title="Button Variants">
        <View className="gap-3">
          <Button
            variant="primary"
            label="Primary (Brand Teal)"
            onPress={() => Alert.alert("Primary")}
          />
          <Button variant="cta" label="CTA (Orange)" onPress={() => Alert.alert("CTA")} />
          <Button variant="outline" label="Outline" onPress={() => Alert.alert("Outline")} />
          <Button variant="secondary" label="Secondary" onPress={() => Alert.alert("Secondary")} />
          <Button variant="ghost" label="Ghost" onPress={() => Alert.alert("Ghost")} />
          <Button
            variant="destructive"
            label="Destructive"
            onPress={() => Alert.alert("Destructive")}
          />
          <Button variant="default" label="Default" onPress={() => Alert.alert("Default")} />
        </View>
      </Section>

      {/* ── Button Sizes ─────────────────────────────────────── */}
      <Section title="Button Sizes">
        <View className="gap-3">
          <Button variant="primary" size="lg" label="Large" onPress={() => {}} />
          <Button variant="primary" size="default" label="Default" onPress={() => {}} />
          <Button variant="primary" size="sm" label="Small" onPress={() => {}} />
        </View>
      </Section>

      {/* ── Disabled State ───────────────────────────────────── */}
      <Section title="Disabled State">
        <View className="gap-3">
          <Button variant="primary" label="Primary (disabled)" disabled onPress={() => {}} />
          <Button variant="cta" label="CTA (disabled)" disabled onPress={() => {}} />
        </View>
      </Section>

      {/* ── Badge Variants ───────────────────────────────────── */}
      <Section title="Badge Variants">
        <View className="flex-row flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Expiring Soon</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </View>
      </Section>

      {/* ── Typography ───────────────────────────────────────── */}
      <Section title="Typography Scale">
        <View className="gap-2">
          <Text variant="heading1">Heading 1</Text>
          <Text variant="heading2">Heading 2</Text>
          <Text variant="heading3">Heading 3</Text>
          <Text variant="heading4">Heading 4</Text>
          <Text variant="title">Title</Text>
          <Text variant="body">Body text — Safe Space, More Possibilities</Text>
          <Text variant="bodySmall">Body Small — Lưu trữ dễ dàng</Text>
          <Text variant="caption">Caption / meta text</Text>
          <Text variant="muted">Muted / helper text</Text>
          <Text variant="label">Label text</Text>
          <Text variant="error">Error message text</Text>
        </View>
      </Section>
    </ScrollView>
  );
}
