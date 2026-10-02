import { ScrollView, View } from "react-native";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

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

export default function LayoutScreen() {
  return (
    <ScrollView className="flex-1 bg-neutral-bg" contentContainerClassName="px-4 py-6">
      {/* ── Header ──────────────────────────────────────────── */}
      <Text variant="heading2" className="mb-1">
        Layout & Data
      </Text>
      <Text variant="muted" className="mb-8">
        Card, Avatar, Skeleton and Separator components.
      </Text>

      {/* ── Card Variants ────────────────────────────────────── */}
      <Section title="Card">
        <View className="gap-4">
          {/* Storage Unit Card */}
          <Card>
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle>Unit A-204</CardTitle>
                <Badge variant="success">Active</Badge>
              </View>
              <CardDescription>District 1 · 5m² · Climate-controlled</CardDescription>
            </CardHeader>
            <CardContent>
              <Text variant="body">
                Lease started Jan 15, 2026. Monthly rate:{" "}
                <Text variant="body" className="font-semibold text-brand">
                  1,200,000 VND
                </Text>
              </Text>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" label="View Details" onPress={() => {}} />
              <Button variant="primary" size="sm" label="Pay Now" onPress={() => {}} />
            </CardFooter>
          </Card>

          {/* Expiring Soon Card */}
          <Card className="border-cta/30 bg-cta-light/20">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle>Unit B-107</CardTitle>
                <Badge variant="warning">Expiring Soon</Badge>
              </View>
              <CardDescription>District 7 · 10m² · Standard</CardDescription>
            </CardHeader>
            <CardContent>
              <Text variant="bodySmall" className="text-cta">
                ⚠ Expires in 5 days. Renew now to avoid interruption.
              </Text>
            </CardContent>
            <CardFooter>
              <Button variant="cta" size="sm" label="Renew Lease" onPress={() => {}} />
            </CardFooter>
          </Card>
        </View>
      </Section>

      {/* ── Avatar ───────────────────────────────────────────── */}
      <Section title="Avatar">
        <View className="gap-6">
          {/* Sizes */}
          <View>
            <Text variant="label" className="mb-3">
              Sizes
            </Text>
            <View className="flex-row items-end gap-4">
              <View className="items-center gap-1">
                <Avatar size="sm">
                  <AvatarFallback label="XS" size="sm" />
                </Avatar>
                <Text variant="caption">sm</Text>
              </View>
              <View className="items-center gap-1">
                <Avatar size="default">
                  <AvatarFallback label="MD" />
                </Avatar>
                <Text variant="caption">default</Text>
              </View>
              <View className="items-center gap-1">
                <Avatar size="lg">
                  <AvatarFallback label="LG" size="lg" />
                </Avatar>
                <Text variant="caption">lg</Text>
              </View>
              <View className="items-center gap-1">
                <Avatar size="xl">
                  <AvatarFallback label="XL" size="xl" />
                </Avatar>
                <Text variant="caption">xl</Text>
              </View>
            </View>
          </View>

          {/* With image */}
          <View>
            <Text variant="label" className="mb-3">
              With Image
            </Text>
            <View className="flex-row items-center gap-3">
              <Avatar size="lg">
                <AvatarImage src="https://i.pravatar.cc/150?img=12" alt="Nguyen Van A" />
                <AvatarFallback label="NA" size="lg" />
              </Avatar>
              <View>
                <Text variant="body" className="font-semibold">
                  Nguyen Van A
                </Text>
                <Text variant="muted">Customer</Text>
              </View>
            </View>
          </View>
        </View>
      </Section>

      {/* ── Skeleton Loading ─────────────────────────────────── */}
      <Section title="Skeleton (Loading State)">
        <View className="gap-4">
          {/* Card skeleton */}
          <View className="rounded-xl border border-border bg-white p-4">
            <View className="flex-row items-center gap-3 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </View>
            </View>
            <Skeleton className="h-3 w-full rounded mb-2" />
            <Skeleton className="h-3 w-5/6 rounded mb-2" />
            <Skeleton className="h-3 w-4/6 rounded mb-4" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </View>

          {/* List skeleton */}
          {[1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </View>
              <Skeleton className="h-6 w-16 rounded-full" />
            </View>
          ))}
        </View>
      </Section>

      {/* ── Separator ────────────────────────────────────────── */}
      <Section title="Separator">
        <View className="gap-4">
          {/* Horizontal */}
          <View className="rounded-xl border border-border bg-white p-4">
            <Text variant="label" className="mb-3">
              Horizontal
            </Text>
            <Separator />
            <Text variant="body" className="mt-3">
              Content below separator
            </Text>
          </View>

          {/* Vertical */}
          <View className="rounded-xl border border-border bg-white p-4">
            <Text variant="label" className="mb-3">
              Vertical
            </Text>
            <View className="flex-row items-center gap-4 h-10">
              <Text variant="body">Left</Text>
              <Separator orientation="vertical" />
              <Text variant="body">Right</Text>
              <Separator orientation="vertical" />
              <Text variant="body">More</Text>
            </View>
          </View>
        </View>
      </Section>
    </ScrollView>
  );
}
