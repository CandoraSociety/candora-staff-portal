import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Clock, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function ELLSchedule() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ["ellClasses"],
    queryFn: () => base44.entities.ELLClass.list(),
  });

  const activeClasses = classes?.filter((c) => c.status === "active" || c.status === "planning") || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Schedule</h1>
        <p className="text-muted-foreground">Weekly class timetable</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : activeClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No scheduled classes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {DAYS.map((day) => {
            const dayClasses = activeClasses
              .filter((c) => c.schedule_days?.includes(day))
              .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

            return (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium capitalize">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  {dayClasses.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No classes</p>
                  ) : (
                    <div className="space-y-2">
                      {dayClasses.map((cls) => (
                        <div key={cls.id} className="p-2 rounded-lg border bg-card">
                          <h4 className="font-medium text-sm">{cls.name}</h4>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {cls.start_time}{cls.end_time ? `–${cls.end_time}` : ""}
                          </div>
                          {cls.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {cls.location}
                            </div>
                          )}
                          {cls.instructor_name && (
                            <p className="text-xs text-muted-foreground mt-1">{cls.instructor_name}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}