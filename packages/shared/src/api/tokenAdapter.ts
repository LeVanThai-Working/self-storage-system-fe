import { API_BASE_URL } from "../constants/api";

export type TokenProviderCallback = () =>
  string | null | undefined | Promise<string | null | undefined>;

export type BaseUrlProviderCallback = () => string;

let tokenProvider: TokenProviderCallback | null = null;
let customBaseUrl: string | null = null;

export const setTokenProvider = (provider: TokenProviderCallback): void => {
  tokenProvider = provider;
};

export const setBaseUrl = (url: string): void => {
  customBaseUrl = url;
};

export const getBaseUrl = (): string => {
  return customBaseUrl || API_BASE_URL;
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!tokenProvider) return null;
  const token = await tokenProvider();
  return token ?? null;
};
