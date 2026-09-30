declare const process: {
  env: {
    NEXT_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_API_BASE_URL?: string;
    [key: string]: string | undefined;
  };
};
