export interface Environment {
  production: boolean;
  OPENROUTER_API_URL: string;
  OPENROUTER_MODEL: string;
  stripePublishableKey: string;
  productUrls: {
    edob: string;
    keyvault: string;
  };
}