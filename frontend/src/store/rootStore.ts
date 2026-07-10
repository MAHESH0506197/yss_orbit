// yss_orbit\frontend\src\store\rootStore.ts
import { configureStore } from '@reduxjs/toolkit';
// Import reducers here

export const store = configureStore({
  reducer: {
    // Add reducers
  },
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
