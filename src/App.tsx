import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EdenRouteTransitionProvider } from "@/components/eden/EdenRouteTransitionProvider";
import Index from "./pages/Index";
import EdenSection from "./pages/EdenSection";
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
              {/* Route "ricercabili" per le sezioni del root */}
              <Route path="/eden" element={<EdenSection sectionId="eden" />} />
              <Route path="/cucina" element={<EdenSection sectionId="cucina" />} />
              <Route path="/gallery" element={<EdenSection sectionId="gallery" />} />
              <Route path="/eventi" element={<EdenSection sectionId="eventi" />} />
              <Route path="/recensioni" element={<EdenSection sectionId="recensioni" />} />
              <Route path="/contatti" element={<EdenSection sectionId="contatti" />} />

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
