import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, FlaskConical } from 'lucide-react';
import { clientFullName } from '@/lib/rcClientVisits';

// Step two: name the person at the desk — match them against the central
// database, or start a brand new profile if they have never been here.
export default function ClientLookupCard({ clients = [], isLoading, creatingTest, onSelect, onCreateProfile, onCreateTestClient }) {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="space-y-1.5">
          <Label>Find the client</Label>
          <Select onValueChange={(id) => onSelect(clients.find(c => c.id === id))}>
            <SelectTrigger>
              <SelectValue placeholder={isLoading ? 'Loading clients...' : 'Search the database by name...'} />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {clientFullName(c)}{c.phone ? ` · ${c.phone}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <p className="text-xs text-muted-foreground flex-1">Client doesn't have an existing profile?</p>
          <Button variant="outline" size="sm" onClick={onCreateTestClient} disabled={creatingTest}>
            <FlaskConical className="h-4 w-4" /> {creatingTest ? 'Creating...' : 'Create Test Client'}
          </Button>
          <Button variant="outline" size="sm" onClick={onCreateProfile}>
            <UserPlus className="h-4 w-4" /> Create Client Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}