import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function EventsMgrContacts() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: contacts, isLoading } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => base44.entities.Contact.list(),
  });

  const filteredContacts = contacts?.filter((contact) => {
    const matchesSearch = 
      contact.first_name.toLowerCase().includes(search.toLowerCase()) ||
      contact.last_name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email?.toLowerCase().includes(search.toLowerCase()) ||
      contact.organization?.toLowerCase().includes(search.toLowerCase());
    
    if (filterType === "subscribed") return matchesSearch && contact.is_subscribed;
    if (filterType === "donor") return matchesSearch && contact.donor_status !== "prospect";
    if (filterType === "volunteer") return matchesSearch && contact.volunteer_status !== "interested";
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Contacts</h1>
          <p className="text-muted-foreground">Manage your contact database</p>
        </div>
        <Link to="/eventsmgr/contacts/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
        >
          <option value="all">All Contacts</option>
          <option value="subscribed">Subscribed</option>
          <option value="donor">Donors</option>
          <option value="volunteer">Volunteers</option>
        </select>
      </div>

      {/* Contacts Table */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredContacts?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No contacts found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Contact</th>
                    <th className="text-left p-4 font-medium">Organization</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts?.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-muted/50">
                      <td className="p-4">
                        <Link to={`/eventsmgr/contacts/${contact.id}`} className="hover:underline">
                          <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                        </Link>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {contact.email && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{contact.organization}</div>
                        {contact.title && (
                          <div className="text-xs text-muted-foreground">{contact.title}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {contact.is_subscribed && (
                            <Badge variant="secondary" className="text-xs">Subscribed</Badge>
                          )}
                          {contact.donor_status !== "prospect" && (
                            <Badge className="bg-success/10 text-success text-xs">
                              {contact.donor_status}
                            </Badge>
                          )}
                          {contact.volunteer_status !== "interested" && (
                            <Badge className="bg-primary/10 text-primary text-xs">
                              {contact.volunteer_status}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">{contact.total_events_attended || 0} events</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}