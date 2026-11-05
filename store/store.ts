import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import propertiesReducer from './slices/propertiesSlice';
import packagesReducer from './slices/packagesSlice';
import experiencesReducer from './slices/experiencesSlice';
import bookingsReducer from './slices/bookingsSlice';
import adsReducer from './slices/adsSlice';
import vendorsReducer from './slices/vendorsSlice';
import usersReducer from './slices/usersSlice';
import payoutsReducer from './slices/payoutsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
    packages: packagesReducer,
    experiences: experiencesReducer,
    bookings: bookingsReducer,
    ads: adsReducer,
    vendors: vendorsReducer,
    users: usersReducer,
    payouts: payoutsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
