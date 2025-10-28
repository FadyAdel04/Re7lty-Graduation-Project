import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedTrips from "@/components/FeaturedTrips";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <FeaturedTrips />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
