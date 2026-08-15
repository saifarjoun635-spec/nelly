import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookingProvider } from "@/components/BookingModal";
import { publicApi } from "@/lib/api";

export default function Layout({ children }) {
  const [content, setContent] = useState(null);
  const [services, setServices] = useState([]);

  useEffect(() => {
    publicApi.getContent().then(setContent).catch(() => {});
    publicApi.getServices().then(setServices).catch(() => {});
  }, []);

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0e]">
        <div className="font-serif gold-gradient-text brand-shimmer text-3xl">Nelly Glam</div>
      </div>
    );
  }

  return (
    <BookingProvider services={services}>
      <Navbar />
      <main>{children({ content, services })}</main>
      <Footer contact={content.contact} />
    </BookingProvider>
  );
}
