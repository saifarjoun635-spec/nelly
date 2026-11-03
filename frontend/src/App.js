import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import Home from "@/pages/Home";
import Soins from "@/pages/Soins";
import Clinique from "@/pages/Clinique";
import Boutique from "@/pages/Boutique";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

function App() {
  return (
    <div className="App grain">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/soins" element={<Soins />} />
              <Route path="/la-clinique" element={<Clinique />} />
              <Route path="/boutique" element={<Boutique />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
