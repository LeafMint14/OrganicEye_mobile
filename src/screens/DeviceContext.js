import React, { createContext, useState, useContext } from 'react';

// 1. Create the Context (The Brain)
const DeviceContext = createContext();

// 2. Create the Provider (The wrapper that holds the state)
export const DeviceProvider = ({ children }) => {
  // Set the default device to Unit 1 so the app never crashes on an empty screen
  const [globalDeviceId, setGlobalDeviceId] = useState('pi-unit-001'); 

  return (
    <DeviceContext.Provider value={{ globalDeviceId, setGlobalDeviceId }}>
      {children}
    </DeviceContext.Provider>
  );
};

// 3. Create a custom hook so screens can easily access it
export const useDevice = () => {
  return useContext(DeviceContext);
};