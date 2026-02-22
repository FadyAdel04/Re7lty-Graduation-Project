import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";

const TripAIChatWidget = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const handleClick = () => {
    if (!isSignedIn) {
      navigate("/auth");
      return;
    }
    navigate("/trip-assistant");
  };

  return (
    <div className="fixed bottom-4 left-4 z-50" id="trip-ai-widget">
      <div className="relative glow-wrapper">
        <Button
          className="relative z-10 h-14 px-8 rounded-full 
          bg-gradient-to-r from-primary to-orange-600 
          hover:from-orange-500 hover:to-orange-700 
          text-white font-bold text-lg 
          shadow-lg transition-all"
          size="lg"
          onClick={handleClick}
        >
          <Bot className="ml-2 h-5 w-5" />
          <span className="hidden md:inline">مساعدك الذكي</span>
        </Button>
      </div>
    </div>
  );
};

export default TripAIChatWidget;
