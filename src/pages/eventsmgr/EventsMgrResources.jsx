import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { BookOpen, Plus, Search, ExternalLink, PlayCircle, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const resourceTypeIcons = {
  video: PlayCircle,
  article: FileText,
  course: BookOpen,
  webinar: PlayCircle,
  podcast: PlayCircle,
  guide: FileText,
  template: FileText,
  other: BookOpen,
};

export default function EventsMgrResources() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: resources, isLoading } = useQuery({
    queryKey: ["learning-resources"],
    queryFn: () => base44.entities.LearningResource.list(),
  });

  const filteredResources = resources?.filter((resource) => {
    const matchesSearch = resource.title.toLowerCase().includes(search.toLowerCase()) ||
      resource.description?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || resource.resource_type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Learning Resources</h1>
          <p className="text-muted-foreground">Educational content and materials</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All Types</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="course">Course</option>
          <option value="webinar">Webinar</option>
          <option value="podcast">Podcast</option>
          <option value="guide">Guide</option>
          <option value="template">Template</option>
        </select>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredResources?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No resources found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources?.map((resource) => {
            const Icon = resourceTypeIcons[resource.resource_type] || BookOpen;
            return (
              <Card key={resource.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{resource.title}</CardTitle>
                        <CardDescription className="capitalize">{resource.resource_type}</CardDescription>
                      </div>
                    </div>
                    {resource.is_featured && (
                      <Badge variant="secondary">Featured</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resource.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {resource.duration_minutes && (
                      <span className="text-muted-foreground">⏱ {resource.duration_minutes} min</span>
                    )}
                    {resource.difficulty && (
                      <Badge variant="outline" className="text-xs">{resource.difficulty}</Badge>
                    )}
                    {resource.is_free ? (
                      <span className="text-success font-medium">Free</span>
                    ) : (
                      <span className="text-muted-foreground">${resource.price}</span>
                    )}
                  </div>
                  {resource.topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {resource.topics.slice(0, 3).map((topic) => (
                        <Badge key={topic} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      View Resource <ExternalLink className="h-3 w-3" />
                    </a>
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