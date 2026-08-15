import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useBooking } from "@/components/BookingModal";

const NAV = [
  { label: "Soins", to: "/soins" },
  { label: "La Clinique", to: "/la-clinique" },
  { label: "Contact", to: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { openBooking } = useBooking();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goContact = () => {
    setOpen(false);
    if (location.pathname === "/") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 400);
    }
  };

  const handleNav = (item) => {
    if (item.to === "#contact") return goContact();
    setOpen(false);
    navigate(item.to);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || open ? "bg-[#0d0d0e]/95 backdrop-blur-md py-4 border-b border-[#c6a15b]/10" : "py-6"
      }`}
    >
      <div className="ng-container flex items-center justify-between">
        <Link to="/" className="font-serif text-gold text-xl tracking-wide link-underline">
          Accueil
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {NAV.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item)}
              className="text-[0.72rem] tracking-label uppercase text-[#efe9e0]/80 hover:text-gold transition-colors link-underline"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button className="btn-gold hidden sm:block" onClick={() => openBooking()}>
            <span>Prendre rendez-vous</span>
          </button>
          <button className="md:hidden text-gold" onClick={() => setOpen((o) => !o)} aria-label="menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden mt-4 bg-[#0d0d0e] border-t border-[#c6a15b]/15 shadow-2xl shadow-black/60">
          <div className="ng-container py-6 flex flex-col gap-5">
            {NAV.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item)}
                className="text-left text-sm tracking-label uppercase text-[#efe9e0]/85 hover:text-gold transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button className="btn-gold-solid mt-2 w-full" onClick={() => { setOpen(false); openBooking(); }}>
              Prendre rendez-vous
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
