import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

const CSV_COLUMNS = [
  'first_name', 'last_name', 'email', 'phone', 'address', 'city', 'birth_date', 'gender',
  'volunteer_type', 'status', 'start_date', 'total_hours', 'company_name', 'school_name',
  'skills', 'availability', 'programs', 'emergency_contact_name', 'emergency_contact_phone',
  'crc', 'irc', 'ell_level', 'allergies', 'food_restriction', 'pictures_consent', 'how_heard',
  'notes', 'pin_code', 'is_deceased', 'deceased_date'
];

const parseCSV = (text) => {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { data: [], error: 'File must have header and at least one data row' };
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Validate headers
  const missingColumns = CSV_COLUMNS.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    return { data: [], error: `Missing columns: ${missingColumns.join(', ')}` };
  }
  
  const data = [];
  const errors = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (doesn't handle quoted commas - can be enhanced if needed)
    const values = line.split(',').map(v => v.trim());
    const row = {};
    
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    
    // Parse according to rules
    try {
      const volunteer = {
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
        city: row.city || '',
        birth_date: row.birth_date || '',
        gender: row.gender || '',
        volunteer_type: row.volunteer_type || 'community',
        status: row.status || 'pending',
        start_date: row.start_date || '',
        total_hours: row.total_hours ? parseFloat(row.total_hours) : 0,
        company_name: row.company_name || '',
        school_name: row.school_name || '',
        skills: row.skills || '',
        availability: row.availability || '',
        programs: row.programs ? row.programs.split('|').filter(p => p.trim()) : [],
        emergency_contact_name: row.emergency_contact_name || '',
        emergency_contact_phone: row.emergency_contact_phone || '',
        crc: row.crc || '',
        irc: row.irc || '',
        ell_level: row.ell_level || '',
        allergies: row.allergies || '',
        food_restriction: row.food_restriction || '',
        pictures_consent: row.pictures_consent || '',
        how_heard: row.how_heard || '',
        notes: row.notes || '',
        pin_code: row.pin_code || '',
        is_deceased: row.is_deceased === 'true',
        deceased_date: row.deceased_date || '',
        corporate_members: []
      };
      
      // Validate required fields
      if (!volunteer.first_name || !volunteer.last_name) {
        errors.push(`Row ${i + 1}: Missing first_name or last_name`);
      } else if (!['community', 'skilled', 'practicum', 'corporate', 'internal_placement'].includes(volunteer.volunteer_type)) {
        errors.push(`Row ${i + 1}: Invalid volunteer_type "${volunteer.volunteer_type}"`);
      } else if (!['pending', 'active', 'occasional', 'inactive', 'suspended'].includes(volunteer.status)) {
        errors.push(`Row ${i + 1}: Invalid status "${volunteer.status}"`);
      } else {
        data.push(volunteer);
      }
    } catch (err) {
      errors.push(`Row ${i + 1}: Parse error - ${err.message}`);
    }
  }
  
  return { data, errors };
};

export default function VolunteerMgrImport() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);
  const [imported, setImported] = useState(false);
  const queryClient = useQueryClient();

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setProcessing(true);
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const result = parseCSV(text);
        
        if (result.error) {
          toast.error(result.error);
          setPreview(null);
          setParseErrors([]);
        } else {
          setPreview(result.data);
          setParseErrors(result.errors);
          if (result.errors.length > 0) {
            toast.warning(`${result.errors.length} rows had parsing errors`);
          }
        }
      } catch (error) {
        toast.error('Failed to parse CSV file');
        setPreview(null);
        setParseErrors([]);
      } finally {
        setProcessing(false);
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file');
      setProcessing(false);
    };
    
    reader.readAsText(selectedFile);
  };

  const importMutation = useMutation({
    mutationFn: async (volunteers) => {
      await base44.entities.Volunteer.bulkCreate(volunteers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vol-volunteers'] });
      setImported(true);
      toast.success(`Successfully imported ${preview.length} volunteers!`);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
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
        description="Bulk import volunteers from CSV file"
      />

      {!file && (
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
              <p className="text-sm text-muted-foreground mb-2">
                File must be named: volunteers_export.csv
              </p>
              <p className="text-xs text-muted-foreground mb-4 max-w-md">
                Required columns: first_name, last_name, email, phone, address, city, birth_date, gender, volunteer_type, status, start_date, total_hours, company_name, school_name, skills, availability, programs, emergency_contact_name, emergency_contact_phone, crc, irc, ell_level, allergies, food_restriction, pictures_consent, how_heard, notes, pin_code, is_deceased, deceased_date
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={processing}
                className="max-w-sm"
              />
              {processing && (
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
        <>
          {parseErrors.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Parsing Errors ({parseErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-auto space-y-1">
                  {parseErrors.map((error, idx) => (
                    <p key={idx} className="text-sm text-destructive">{error}</p>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  These rows will be skipped. Fix the errors in your CSV and re-upload if needed.
                </p>
              </CardContent>
            </Card>
          )}
          
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
                      <th className="p-2">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {preview.map((vol, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="p-2">{vol.first_name}</td>
                        <td className="p-2">{vol.last_name}</td>
                        <td className="p-2">{vol.email}</td>
                        <td className="p-2">{vol.phone || '-'}</td>
                        <td className="p-2">{vol.volunteer_type}</td>
                        <td className="p-2">{vol.status}</td>
                        <td className="p-2">{vol.total_hours}</td>
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
        </>
      )}

      {imported && (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Import Complete!</h3>
            <p className="text-muted-foreground mb-4">
              Successfully imported {preview?.length} volunteer{preview?.length !== 1 ? 's' : ''}.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.href = '/volunteermgr/volunteers'}>
                View Volunteers
              </Button>
              <Button variant="outline" onClick={resetImport}>
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}