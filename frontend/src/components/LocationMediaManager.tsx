import { useState } from 'react';
import { Upload, Image as ImageIcon, Video, X, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { TripLocation } from './TripMapEditor';

interface LocationMediaManagerProps {
  locations: TripLocation[];
  onLocationsChange: (locations: TripLocation[]) => void;
}

const LocationMediaManager = ({ locations, onLocationsChange }: LocationMediaManagerProps) => {
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  const handleImageUpload = (locationId: string, files: FileList | null) => {
    if (!files) return;
    
    const newImages = Array.from(files);
    onLocationsChange(
      locations.map(loc =>
        loc.id === locationId
          ? { ...loc, images: [...(loc.images || []), ...newImages] }
          : loc
      )
    );
  };

  const handleVideoUpload = (locationId: string, files: FileList | null) => {
    if (!files) return;
    
    const newVideos = Array.from(files);
    onLocationsChange(
      locations.map(loc =>
        loc.id === locationId
          ? { ...loc, videos: [...(loc.videos || []), ...newVideos] }
          : loc
      )
    );
  };

  const removeImage = (locationId: string, imageIndex: number) => {
    onLocationsChange(
      locations.map(loc =>
        loc.id === locationId
          ? { ...loc, images: (loc.images || []).filter((_, i) => i !== imageIndex) }
          : loc
      )
    );
  };

  const removeVideo = (locationId: string, videoIndex: number) => {
    onLocationsChange(
      locations.map(loc =>
        loc.id === locationId
          ? { ...loc, videos: (loc.videos || []).filter((_, i) => i !== videoIndex) }
          : loc
      )
    );
  };

  const updateLocationDetails = (locationId: string, field: 'name' | 'description', value: string) => {
    onLocationsChange(
      locations.map(loc =>
        loc.id === locationId ? { ...loc, [field]: value } : loc
      )
    );
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>لم يتم إضافة أي مواقع بعد</p>
        <p className="text-sm mt-2">ارجع للخطوة السابقة لإضافة مواقع على الخريطة</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">أضف الصور والفيديوهات لكل موقع</h3>
      
      {locations.map((location, index) => (
        <Card key={location.id} className="overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setExpandedLocation(expandedLocation === location.id ? null : location.id)}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{location.name || `موقع ${index + 1}`}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {location.images && location.images.length > 0 && (
                  <span className="flex items-center gap-1">
                    <ImageIcon className="h-4 w-4" />
                    {location.images.length}
                  </span>
                )}
                {location.videos && location.videos.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Video className="h-4 w-4" />
                    {location.videos.length}
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          {expandedLocation === location.id && (
            <CardContent className="space-y-4 pt-4">
              {/* Location Details */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>اسم المكان *</Label>
                  <Input
                    placeholder="مثال: قلعة قايتباي"
                    value={location.name}
                    onChange={(e) => updateLocationDetails(location.id, 'name', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>وصف المكان</Label>
                  <Textarea
                    placeholder="اكتب وصفاً عن تجربتك في هذا المكان..."
                    rows={3}
                    value={location.description}
                    onChange={(e) => updateLocationDetails(location.id, 'description', e.target.value)}
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  الإحداثيات: {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label>الصور</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(location.images || []).map((image, imgIndex) => {
                    const imageSrc = image instanceof File 
                      ? URL.createObjectURL(image) 
                      : (typeof image === 'string' ? image : '');
                    return (
                      <div key={imgIndex} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                        <img
                          src={imageSrc}
                          alt={`Upload ${imgIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(location.id, imgIndex)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                  
                  <label className="aspect-square border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">إضافة صور</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleImageUpload(location.id, e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {/* Video Upload */}
              <div className="space-y-2">
                <Label>الفيديوهات (قصيرة)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(location.videos || []).map((video, vidIndex) => (
                    <div key={vidIndex} className="relative group aspect-video rounded-lg overflow-hidden bg-muted">
                      <video
                        src={video instanceof File ? URL.createObjectURL(video) : (typeof video === 'string' ? video : '')}
                        className="w-full h-full object-cover"
                        controls
                      />
                      <button
                        onClick={() => removeVideo(location.id, vidIndex)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  
                  <label className="aspect-video border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Video className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">إضافة فيديو</span>
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleVideoUpload(location.id, e.target.files)}
                    />
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  يُفضل فيديوهات قصيرة (أقل من 30 ثانية)
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default LocationMediaManager;