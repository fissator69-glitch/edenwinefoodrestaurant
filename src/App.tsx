import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EdenRouteTransitionProvider } from "@/components/eden/EdenRouteTransitionProvider";
import Index from "./pages/Index";
import LocandaEden from "./pages/LocandaEden";
import MasseriaPetrullo from "./pages/MasseriaPetrullo";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ResetPassword from "./pages/admin/ResetPassword";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
          <EdenRouteTransitionProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/locanda-eden" element={<LocandaEden />} />
              <Route path="/masseria-petrullo" element={<MasseriaPetrullo />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route
                path="/admin"
                element={
                  <ProtectedAdminRoute>
                    <AdminDashboard />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </EdenRouteTransitionProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
