import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GitBranch, Users, Lightbulb, FolderOpen, ArrowRight } from "lucide-react";

export default function ArchivesHome() {
  const { data: timelineItems } = useQuery({
    queryKey: ["archiveTimelineItems"],
    queryFn: () => base44.entities.ArchiveTimelineItem.list("-year", 50),
  });
  const { data: bios } = useQuery({
    queryKey: ["archiveBios"],
    queryFn: () => base44.entities.ArchiveBio.list(),
  });
  const { data: stories } = useQuery({
    queryKey: ["archiveStories"],
    queryFn: () => base44.entities.ArchiveStory.list(),
  });
  const { data: documents } = useQuery({
    queryKey: ["archiveDocuments"],
    queryFn: () => base44.entities.File.filter({ category: "archives" }),
  });

  const featured = (timelineItems || []).filter(i => i.is_featured).slice(0, 3);
  const featuredStories = (stories || []).filter(s => s.is_featured).slice(0, 2);
  const oldestItem = (timelineItems || []).slice().sort((a, b) => a.year - b.year)[0];

  const stats = [
    { title: "Timeline Events", value: timelineItems?.length || 0, icon: GitBranch, href: "/archives/timeline", color: "bg-primary" },
    { title: "Biographies", value: bios?.length || 0, icon: Users, href: "/archives/bios", color: "bg-accent" },
    { title: "Stories", value: stories?.length || 0, icon: Lightbulb, href: "/archives/stories", color: "bg-chart-3" },
    { title: "Documents", value: documents?.length || 0, icon: FolderOpen, href: "/archives/documents", color: "bg-success" },
  ];

  const quickLinks = [
    { title: "Interactive Timeline", desc: "Explore key moments in Candora's history", href: "/archives/timeline", icon: GitBranch },
    { title: "Full Chronicle", desc: "Read the complete history as a document", href: "/archives/timeline/chronicle", icon: Users },
    { title: "People of Candora", desc: "Bios of significant individuals", href: "/archives/bios", icon: Users },
    { title: "Interesting Stories", desc: "Memorable tales and anecdotes", href: "/archives/stories", icon: Lightbulb },
    { title: "Document Archive", desc: "Photos, clippings, and historical files", href: "/archives/documents", icon: FolderOpen },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-sidebar p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-sidebar-foreground mb-2">Candora Archives</h1>
          <p className="text-sidebar-foreground/80 text-lg max-w-2xl">
            Preserving the stories, people, and milestones that shaped our organization.
          </p>
          {oldestItem && (
            <p className="text-sidebar-foreground/60 text-sm mt-3">
              From {oldestItem.year} to today — {(timelineItems || []).length} events documented.
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}><stat.icon className="h-4 w-4 text-white" /></div>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{stat.value}</div></CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Featured Timeline */}
      {featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Featured Moments</h2>
            <Link to="/archives/timeline" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featured.map(item => (
              <Link key={item.id} to={`/archives/timeline/${item.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full overflow-hidden">
                  {item.media?.[0]?.type === "photo" && (
                    <div className="aspect-video overflow-hidden">
                      <img src={item.media[0].url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="text-2xl font-display font-bold text-primary">{item.year}</div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                  </CardHeader>
                  {item.summary && <CardContent><p className="text-sm text-muted-foreground line-clamp-2">{item.summary}</p></CardContent>}
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-display font-bold mb-4">Explore the Archives</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map(link => (
            <Link key={link.href} to={link.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="bg-primary/10 p-2.5 rounded-lg flex-shrink-0"><link.icon className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h4 className="font-medium text-sm">{link.title}</h4>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Stories */}
      {featuredStories.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold">Featured Stories</h2>
            <Link to="/archives/stories" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredStories.map(story => (
              <Card key={story.id}>
                <CardHeader>
                  <CardTitle className="text-base">{story.title}</CardTitle>
                  {story.story_date && <CardDescription>{new Date(story.story_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: story.content || "" }} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}