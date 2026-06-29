export const appConfig = {
  aiMode: import.meta.env.VITE_AI_MODE || "mock",
  deepseekApiUrl: import.meta.env.VITE_DEEPSEEK_API_URL || "",
  hasDeepseekKey: Boolean(import.meta.env.VITE_DEEPSEEK_API_KEY),
};
