import Header from "@/components/Header";
import Footer from "@/components/Footer";
import logo from "@/assets/logo.png";
import { Link, Navigate } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

const SignUpPage = () => {
  return (
    <>
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
      <SignedOut>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-secondary-light via-background to-primary/5 flex items-center justify-center p-4">
          {/* Decorative Background */}
          <div className="absolute inset-0 overflow-hidden opacity-10">
            <div className="absolute top-20 right-20 h-64 w-64 rounded-full bg-primary blur-3xl" />
            <div className="absolute bottom-20 left-20 h-64 w-64 rounded-full bg-secondary blur-3xl" />
          </div>

          <div className="w-full max-w-md relative z-10 animate-slide-up">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Link to="/" className="flex items-center">
                  <img
                    src={logo}
                    alt="رحلتي"
                    className="h-20 w-auto sm:h-24 md:h-28 transition-all duration-300 hover:scale-105"
                  />
                </Link>
              </div>
              <p className="text-muted-foreground">ابدأ مغامرتك القادمة</p>
            </div>

            <SignUp 
              appearance={{
                elements: {
                  rootBox: "mx-auto",
                  card: "shadow-float-lg border-0",
                  headerTitle: "text-center text-2xl",
                  headerSubtitle: "text-center",
                }
              }}
              routing="path"
              path="/auth/sign-up"
              signInUrl="/auth/sign-in"
            />
          </div>
        </div>
        <Footer />
      </SignedOut>
    </>
  );
};

export default SignUpPage;


