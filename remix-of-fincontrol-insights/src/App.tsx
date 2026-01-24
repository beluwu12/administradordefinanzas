import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import { NotificationSettingsProvider } from "./contexts/NotificationSettingsContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Index from "./pages/Index";
import Transactions from "./pages/Transactions";
import Categories from "./pages/Categories";
import Budget from "./pages/Budget";
import Goals from "./pages/Goals";
import GoalDetail from "./pages/GoalDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <LanguageProvider>
      <CurrencyProvider>
        <NotificationSettingsProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected routes */}
                    <Route element={
                      <ProtectedRoute>
                        <MainLayout />
                      </ProtectedRoute>
                    }>
                      <Route path="/" element={<Index />} />
                      <Route path="/transactions" element={<Transactions />} />
                      <Route path="/categories" element={<Categories />} />
                      <Route path="/budget" element={<Budget />} />
                      <Route path="/goals" element={<Goals />} />
                      <Route path="/goals/:id" element={<GoalDetail />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </QueryClientProvider>
        </NotificationSettingsProvider>
      </CurrencyProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
