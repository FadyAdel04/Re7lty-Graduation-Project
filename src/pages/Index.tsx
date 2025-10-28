import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedTrips from "@/components/FeaturedTrips";
import FilterSection from "@/components/FilterSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <FilterSection />
        <FeaturedTrips />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
