import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedTrips from "@/components/FeaturedTrips";
import FilterSection from "@/components/FilterSection";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import TopTrips from "@/components/TopTrips";
import TopAuthors from "@/components/TopAuthors";

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

        {/* Weekly Top Section */}
        <section className="container mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">الأفضل هذا الأسبوع</h2>
            <Link to="/leaderboard">
              <Button variant="outline" className="rounded-full">عرض لوحة المتصدرين</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopTrips />
            <TopAuthors />
          </div>
        </section>

        <FilterSection onFilterChange={setFilters} />
        <FeaturedTrips searchQuery={searchQuery} filters={filters} />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
