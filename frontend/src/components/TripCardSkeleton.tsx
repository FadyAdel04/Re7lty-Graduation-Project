import { Card } from "@/components/ui/card";

const TripCardSkeleton = () => {
  return (
    <Card className="overflow-hidden rounded-2xl border-gray-100 animate-pulse">
      {/* Image Skeleton */}
      <div className="h-56 bg-gray-200" />
      
      {/* Content Skeleton */}
      <div className="p-5 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        
        {/* Meta Info */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>

        {/* Button */}
        <div className="h-10 bg-gray-200 rounded-xl mt-3" />
      </div>
    </Card>
  );
};

export default TripCardSkeleton;
