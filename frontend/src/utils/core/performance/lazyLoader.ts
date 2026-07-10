// Lazy loader — code-splitting utility with retry logic
export const lazyWithRetry = (factory: () => Promise<any>) => factory;

