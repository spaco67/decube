import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './contexts/ThemeContext';
import { OrderProvider } from './contexts/OrderContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { ReportsProvider } from './contexts/ReportsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <InventoryProvider>
        <OrderProvider>
          <ReportsProvider>
            <App />
          </ReportsProvider>
        </OrderProvider>
      </InventoryProvider>
    </ThemeProvider>
  </StrictMode>
);