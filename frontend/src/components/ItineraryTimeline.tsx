import { ItineraryDay } from "@/types/corporateTrips";
import { CheckCircle2 } from "lucide-react";

interface ItineraryTimelineProps {
  itinerary: ItineraryDay[];
}

const ItineraryTimeline = ({ itinerary }: ItineraryTimelineProps) => {
  return (
    <div className="space-y-8">
      {itinerary.map((day, index) => (
        <div key={day.day} className="relative">
          {/* Timeline Line */}
          {index < itinerary.length - 1 && (
            <div className="absolute right-[19px] top-12 w-0.5 h-[calc(100%+2rem)] bg-gradient-to-b from-orange-500 to-orange-200" />
          )}
          
          <div className="flex gap-6">
            {/* Day Number Circle */}
            <div className="flex-none">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold shadow-lg relative z-10">
                {day.day}
              </div>
            </div>

            {/* Day Content */}
            <div className="flex-1 pb-8">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  اليوم {day.day}: {day.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {day.description}
                </p>
                
                {/* Activities List */}
                <div className="space-y-2">
                  {day.activities.map((activity, actIndex) => (
                    <div key={actIndex} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-orange-500 flex-none mt-0.5" />
                      <span className="text-gray-700">{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ItineraryTimeline;
