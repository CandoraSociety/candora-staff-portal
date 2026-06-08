import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Reports() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-[#1a237e]">Reports</h1>
        <p className="text-muted-foreground mt-1">Outcomes, data, and staff reports</p>
      </div>

      <Tabs defaultValue="outcomes" className="w-full">
        <TabsList>
          <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          <TabsTrigger value="data">Data Reports</TabsTrigger>
          <TabsTrigger value="staff">Staff Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value="outcomes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Program Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Outcome metrics and KPIs will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Customizable data reports with filters</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Monthly Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Staff narrative report submissions</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}