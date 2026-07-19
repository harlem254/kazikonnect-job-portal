import React from "react";
import Header from "./Components/Header";
import Hero from "./Components/Hero";
import Features from "./Components/Features";
import Analytics from "./Components/Analytics";
import Footer from "./Components/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Features />
      <Analytics />
      <Footer />
    </div>
  );
};

export default LandingPage;
