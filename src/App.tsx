// ===============================
// File: src/App.tsx
// ===============================

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import CreateInvoice from "./pages/CreateInvoice";
import Customers from "./pages/Customers";
import Invoices from "./pages/Invoices";
import Files from "./pages/Files";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// ✅ Import your Google Drive service
import { googleDriveService } from "./utils/googleDrive";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // ✅ This runs once on first load
    googleDriveService.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<CreateInvoice />} />
              <Route path="customers" element={<Customers />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="files" element={<Files />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
