/**
 * UI component barrel — mirrors the web's components/ui/ exports.
 * Import from here to keep imports clean:
 *   import { Button, Card, Input } from '@/components/ui';
 */
export { Avatar, AvatarImage, AvatarFallback } from "./avatar";
export type {} from "./avatar";

export { Badge } from "./badge";
export type { BadgeProps } from "./badge";

export { Button } from "./button";
export type { ButtonProps } from "./button";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./card";

export { Input } from "./input";
export type { InputProps } from "./input";

export { Label } from "./label";
export type { LabelProps } from "./label";

export { Separator } from "./separator";
export type { SeparatorProps } from "./separator";

export { Skeleton } from "./skeleton";
export type { SkeletonProps } from "./skeleton";

export { Text } from "./text";
export type { TextProps } from "./text";
