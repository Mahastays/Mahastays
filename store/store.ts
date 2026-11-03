import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import propertyReducer from './slices/propertyslice';
import packageReducer from './slices/packageslice';
import experienceReducer from './slices/experienceslice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertyReducer,
    packages: packageReducer,
    experiences: experienceReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
