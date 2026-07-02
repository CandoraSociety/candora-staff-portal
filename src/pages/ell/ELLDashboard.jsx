import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, BookOpen, UserCog, ClipboardCheck, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

export default function ELLDashboard() {
  const { data: learners } = useQuery({
    queryKey: ["ellLearners"],
    queryFn: () => base44.entities.ELLLearner.list(),
  });

  const { data: classes } = useQuery({
    queryKey: ["ellClasses"],
    queryFn: () => base44.entities.ELLClass.list(),
  });

  const { data: instructors } = useQuery({
    queryKey: ["ellInstructors"],
    queryFn: () => base44.entities.ELLInstructor.list(),
  });

  const { data: assessments } = useQuery({
    queryKey: ["ellAssessments"],
    queryFn: () => base44.entities.ELLAssessment.list(),
  });

  const stats = [
    {
      title: "Total Learners",
      value: learners?.length || 0,
      icon: Users,
      href: "/ell/learners",
      color: "bg-primary",
    },
    {
      title: "Active Classes",
      value: classes?.filter((c) => c.status === "active").length || 0,
      icon: BookOpen,
      href: "/ell/classes",
      color: "bg-success",
    },
    {
      title: "Instructors",
      value: instructors?.filter((i) => i.status === "active").length || 0,
      icon: UserCog,
      href: "/ell/instructors",
      color: "bg-accent",
    },
    {
      title: "Assessments",
      value: assessments?.length || 0,
      icon: ClipboardCheck,
      href: "/ell/assessments",
      color: "bg-chart-3",
    },
  ];

  const activeClasses = classes?.filter((c) => c.status === "active").slice(0, 5) || [];
  const recentLearners = [...(learners || [])]
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your English Language Learning program</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Active Classes</CardTitle>
            <CardDescription>Currently running</CardDescription>
          </CardHeader>
          <CardContent>
            {activeClasses.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active classes</p>
            ) : (
              <div className="space-y-3">
                {activeClasses.map((cls) => (
                  <Link
                    key={cls.id}
                    to="/ell/classes"
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{cls.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {cls.clb_level?.replace("_", " ").toUpperCase()}
                        {cls.instructor_name ? ` · ${cls.instructor_name}` : ""}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                      Active
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Learners</CardTitle>
            <CardDescription>Latest enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLearners.length === 0 ? (
              <p className="text-muted-foreground text-sm">No learners yet</p>
            ) : (
              <div className="space-y-3">
                {recentLearners.map((learner) => (
                  <Link
                    key={learner.id}
                    to="/ell/learners"
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium text-sm">{learner.first_name} {learner.last_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {learner.clb_level?.replace("_", " ").toUpperCase()}
                        {learner.country_of_origin ? ` · ${learner.country_of_origin}` : ""}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      learner.enrollment_status === "active" ? "bg-success/10 text-success" :
                      learner.enrollment_status === "enrolled" ? "bg-primary/10 text-primary" :
                      learner.enrollment_status === "completed" ? "bg-accent/10 text-accent-foreground" :
                      learner.enrollment_status === "withdrawn" ? "bg-destructive/10 text-destructive-foreground" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {learner.enrollment_status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your ELL program</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/ell/learners"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="bg-primary/10 p-2 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Add Learner</h4>
                <p className="text-xs text-muted-foreground">Enroll a student</p>
              </div>
            </Link>
            <Link
              to="/ell/classes"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="bg-success/10 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-success" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Create Class</h4>
                <p className="text-xs text-muted-foreground">Set up a course</p>
              </div>
            </Link>
            <Link
              to="/ell/instructors"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="bg-accent/10 p-2 rounded-lg">
                <UserCog className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Add Instructor</h4>
                <p className="text-xs text-muted-foreground">Register teacher</p>
              </div>
            </Link>
            <Link
              to="/ell/assessments"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="bg-chart-3/10 p-2 rounded-lg">
                <ClipboardCheck className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <h4 className="font-medium text-sm">New Assessment</h4>
                <p className="text-xs text-muted-foreground">CLB evaluation</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}