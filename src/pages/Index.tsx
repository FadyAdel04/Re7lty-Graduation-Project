import { useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedTrips from "@/components/FeaturedTrips";
import FilterSection from "@/components/FilterSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    city: "",
    duration: "",
    rating: "",
    budget: 10000,
    quickFilter: ""
  });

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={setSearchQuery} />
      <main>
        <Hero />
        <FilterSection onFilterChange={setFilters} />
        <FeaturedTrips searchQuery={searchQuery} filters={filters} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
