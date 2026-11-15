import { configureStore } from '@reduxjs/toolkit';

export const store = configureStore({
  reducer: {
    // TODO: додати редюсери
    auth: () => ({ user: null, token: null }),
    orders: () => ({ items: [], loading: false }),
    trips: () => ({ items: [], loading: false }),
    vehicles: () => ({ items: [], loading: false }),
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
