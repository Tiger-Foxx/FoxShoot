import { Toaster } from 'react-hot-toast';

export const ToastContainer = () => {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1F2937', // surface
          color: '#F3F4F6',      // text
          borderRadius: '4px',
          border: '1px solid #374151',
          padding: '12px 16px',
        },
        success: {
          iconTheme: {
            primary: '#F97316',
            secondary: '#F3F4F6',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#F3F4F6',
          },
        },
      }}
    />
  );
};
