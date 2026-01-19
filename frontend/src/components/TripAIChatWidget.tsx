import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TripAIChatWidget = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button 
        className="rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105" 
        size="lg"
        onClick={() => navigate('/trip-assistant')}
      >
        <MessageCircle className="h-5 w-5 md:ml-2" /> 
        <span className="hidden md:inline">مساعد الرحلات الذكي</span>
      </Button>
    </div>
  );
};

export default TripAIChatWidget;
