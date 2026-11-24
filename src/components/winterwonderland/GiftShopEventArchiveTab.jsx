import React from 'react';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, ExternalLink, CalendarDays, MapPin, Users, Gift, MessageSquare, Ticket } from 'lucide-react';

const dateLabel = (value) => (value ? moment(value).format('dddd, MMMM D, YYYY') : 'Date not recorded');

function Count({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-semibold">{value ?? 0}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

// Every Kids Gift Shop event that has been concluded, with what it collected
// and where its copy sits in SharePoint.
export default function GiftShopEventArchiveTab() {
  const { data: archives = [], isLoading } = useQuery({
    queryKey: ['giftShopEventArchives'],
    queryFn: () => base44.entities.GiftShopEventArchive
      .filter({}, { sort: '-concluded_at', limit: 50 })
      .then(res => res.items || []),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Loading the event archive…</p>;
  }

  if (!archives.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6 text-center space-y-2">
          <div className="mx-auto h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Archive className="h-5 w-5 text-primary" />
          </div>
          <p className="font-medium">No events archived yet</p>
          <p className="text-sm text-muted-foreground">
            When a Kids Gift Shop event is concluded, its details, registrations and messages are kept here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Concluded events, newest first. Each one is also copied to the Winter Wonderland Festival / Kids Gift Shop folder in SharePoint.
      </p>

      {archives.map(archive => (
        <Card key={archive.id}>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {archive.event_name || 'Kids Gift Shop'}
                  <Badge variant="secondary">{archive.event_label || archive.festival_year || ''}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> {dateLabel(archive.event_date)}</span>
                  {archive.venue && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {archive.venue}</span>}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Concluded {archive.concluded_at ? moment(archive.concluded_at).format('MMM D, YYYY h:mm A') : ''}</p>
                {archive.concluded_by_name && <p>by {archive.concluded_by_name}</p>}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <Count icon={Users} label="children" value={archive.summary?.children ?? archive.summary?.registrations} />
              <Count icon={Users} label="families" value={archive.summary?.families} />
              <Count icon={Gift} label="signed in" value={archive.summary?.checked_in} />
              <Count icon={Gift} label="completed" value={archive.summary?.completed} />
              <Count icon={Ticket} label="invitations" value={archive.summary?.invites} />
              <Count icon={MessageSquare} label="messages" value={archive.summary?.messages} />
              <Count icon={MessageSquare} label="scheduled messages" value={archive.summary?.scheduled_messages} />
              <Count icon={MessageSquare} label="texts" value={archive.summary?.texts} />
            </div>

            {(archive.sharepoint_files || []).length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Files in {archive.sharepoint_path || 'SharePoint'}</p>
                <div className="flex flex-wrap gap-2">
                  {archive.sharepoint_files.map(file => (
                    file.web_url ? (
                      <Button key={file.item_id || file.name} variant="outline" size="sm" asChild>
                        <a href={file.web_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" /> {file.name}
                        </a>
                      </Button>
                    ) : (
                      <span key={file.item_id || file.name} className="text-xs rounded-md border px-2 py-1">{file.name}</span>
                    )
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}