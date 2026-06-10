import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Check, ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

export const PHOTO_CATEGORIES = [
  { value: "photo_event", label: "Event / Gathering" },
  { value: "photo_people", label: "People / Portraits" },
  { value: "photo_facility", label: "Facility / Building" },
  { value: "photo_product", label: "Product / Equipment" },
  { value: "photo_project", label: "Project / Site" },
  { value: "photo_marketing", label: "Marketing / Promo" },
  { value: "photo_training", label: "Training / Workshop" },
  { value: "photo_document", label: "Document / Receipt" },
  { value: "photo_misc", label: "Miscellaneous" },
  { value: "to_be_sorted", label: "Sort Later" },
];

export default function PhotoSorterDialog({ photos, onDone, onCancel }) {
  const [index, setIndex] = useState(0);
  const [assignments, setAssignments] = useState(() => {
    const m = {};
    photos.forEach((p) => {
      m[p.id] = p.category || "to_be_sorted";
    });
    return m;
  });
  const [previewUrls] = useState(() => {
    const m = {};
    photos.forEach((p) => {
      m[p.id] = URL.createObjectURL(p.file);
    });
    return m;
  });

  const current = photos[index];
  const total = photos.length;

  useEffect(() => {
    return () => {
      // Cleanup blob URLs
      Object.values(previewUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const setCategory = (id, cat) => {
    setAssignments((prev) => ({ ...prev, [id]: cat }));
  };

  const handleCategoryClick = (catValue) => {
    setCategory(current.id, catValue);
    handleNext();
  };

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1);
    } else {
      finish();
    }
  };

  const handleBack = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const handleSkip = () => {
    setCategory(current.id, "to_be_sorted");
    handleNext();
  };

  const finish = () => {
    onDone(
      photos.map((p) => ({
        id: p.id,
        category: assignments[p.id] || "to_be_sorted",
      }))
    );
  };

  if (!current) return null;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Sort Photos
            <Badge variant="outline" className="ml-2">
              {index + 1} of {total}
            </Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground truncate">{current.file.name}</p>
        </DialogHeader>

        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-1 py-2">
          {photos.map((p, i) => {
            const isCategorized = assignments[p.id] && assignments[p.id] !== "to_be_sorted";
            return (
              <div
                key={p.id}
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  i === index ? "bg-primary" : isCategorized ? "bg-success" : "bg-muted"
                )}
              />
            );
          })}
        </div>

        {/* Split Layout */}
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {/* Photo Preview */}
          <div className="bg-black rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={previewUrls[current.id]}
              alt={current.file.name}
              className="max-h-64 object-contain"
            />
          </div>

          {/* Category Buttons */}
          <div className="overflow-y-auto space-y-2 pr-2">
            {PHOTO_CATEGORIES.map((cat) => {
              const isSelected = assignments[current.id] === cat.value;
              return (
                <Button
                  key={cat.value}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "w-full justify-between h-auto py-3 px-4",
                    isSelected && "border-primary bg-primary/10 hover:bg-primary/20"
                  )}
                  onClick={() => handleCategoryClick(cat.value)}
                >
                  <span className="text-sm">{cat.label}</span>
                  {isSelected && <Check className="h-4 w-4 ml-2" />}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleBack} disabled={index === 0}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSkip}>
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
            <Button onClick={index === total - 1 ? finish : handleNext}>
              {index === total - 1 ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}