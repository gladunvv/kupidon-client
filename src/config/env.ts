interface AppEnv {
  apiUrl: string;
  wsUrl: string;
}

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env: AppEnv = {
  apiUrl: required('VITE_API_URL', import.meta.env.VITE_API_URL),
  wsUrl: required('VITE_WS_URL', import.meta.env.VITE_WS_URL),
};
