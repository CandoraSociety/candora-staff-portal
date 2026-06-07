import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

export default function VolunteerMgrImport() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [imported, setImported] = useState(false);
  const queryClient = useQueryClient();

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setUploading(true);
    setFile(selectedFile);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      // Extract data for preview
      const jsonSchema = {
        type: "object",
        properties: {
          volunteers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                first_name: { type: "string" },
                last_name: { type: "string" },
                email: { type: "string" },
                phone: { type: "string" },
                volunteer_type: { type: "string" },
                status: { type: "string" }
              }
            }
          }
        }
      };
      
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: jsonSchema
      });
      
      if (result.status === 'success' && result.output?.volunteers) {
        setPreview(result.output.volunteers);
      } else {
        toast.error('Could not parse file. Make sure it has columns: first_name, last_name, email, volunteer_type');
      }
    } catch (error) {
      toast.error('Failed to process file');
    } finally {
      setUploading(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (volunteers) => {
      const cleanVolunteers = volunteers.map(v => ({
        first_name: v.first_name?.trim(),
        last_name: v.last_name?.trim(),
        email: v.email?.trim(),
        phone: v.phone?.trim(),
        volunteer_type: v.volunteer_type || 'community',
        status: v.status || 'pending',
      }));
      await base44.entities.Volunteer.bulkCreate(cleanVolunteers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-volunteers'] });
      setImported(true);
      toast.success(`Successfully imported ${preview.length} volunteers!`);
    },
  });

  const handleImport = () => {
    if (preview) {
      importMutation.mutate(preview);
    }
  };

  const resetImport = () => {
    setFile(null);
    setPreview(null);
    setImported(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Volunteers"
        description="Bulk import volunteers from Excel or CSV"
      />

      {!file && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload Excel or CSV File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Required columns: first_name, last_name, email, volunteer_type
              </p>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                disabled={uploading}
                className="max-w-sm"
              />
              {uploading && (
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing file...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {preview && !imported && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Preview ({preview.length} volunteers)</CardTitle>
              <Button variant="outline" onClick={resetImport}>Start Over</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="border-b sticky top-0 bg-background">
                  <tr className="text-left">
                    <th className="p-2">First Name</th>
                    <th className="p-2">Last Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Type</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((vol, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-2">{vol.first_name}</td>
                      <td className="p-2">{vol.last_name}</td>
                      <td className="p-2">{vol.email}</td>
                      <td className="p-2">{vol.phone || '-'}</td>
                      <td className="p-2">{vol.volunteer_type || 'community'}</td>
                      <td className="p-2">{vol.status || 'pending'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleImport} disabled={importMutation.isPending} className="flex-1">
                {importMutation.isPending ? 'Importing...' : `Import ${preview.length} Volunteers`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {imported && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
            <p className="text-muted-foreground mb-4">
              Successfully imported {preview?.length} volunteers.
            </p>
            <Button onClick={() => window.location.href = '/volunteermgr/volunteers'}>
              View Volunteers
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}