import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import notFoundImage from "/src/assets/logo.png"; // 🖼️ Add a travel image here (place in /public/assets)

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div
      className="relative flex min-h-screen items-center justify-center text-center text-white"
      style={{
        backgroundImage: `url(${notFoundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Content */}
      <div className="relative z-10 px-6 sm:px-10">
        <h1 className="text-6xl font-extrabold text-purple-400 drop-shadow-lg mb-4">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
          الصفحة غير موجودة 😕
        </h2>
        <p className="text-lg sm:text-xl text-gray-200 mb-8">
          يبدو أنك تائه في رحلتك! <br />
          لا تقلق، يمكنك العودة إلى الصفحة الرئيسية والاستمرار في استكشاف العالم
          🌍
        </p>

        <Link
          to="/"
          className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 shadow-lg hover:shadow-purple-400/50 hover:scale-105"
        >
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>

      {/* Decorative cloud/map shapes (optional aesthetic touch) */}
      <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-black/70 to-transparent"></div>
    </div>
  );
};

export default NotFound;
