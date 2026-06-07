import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import Papa from 'papaparse';

const CSV_COLUMNS = [
  'first_name', 'last_name', 'email', 'phone', 'address', 'city', 'birth_date', 'gender',
  'volunteer_type', 'status', 'start_date', 'total_hours', 'company_name', 'school_name',
  'skills', 'availability', 'programs', 'emergency_contact_name', 'emergency_contact_phone',
  'crc', 'irc', 'ell_level', 'allergies', 'food_restriction', 'pictures_consent', 'how_heard',
  'notes', 'pin_code', 'is_deceased', 'deceased_date'
];

const parseCSV = (text) => {
  // Use Papa Parse for proper CSV parsing (handles quoted fields, commas, newlines, etc.)
  const parseResult = Papa.parse(text, {
    header: true,
    skipEmptyLines: false,
    dynamicTyping: false,
    transformHeader: (header) => header.trim().toLowerCase()
  });

  if (parseResult.errors.length > 0) {
    const criticalErrors = parseResult.errors.filter(e => e.type === 'Header' || e.type === 'Delimiter');
    if (criticalErrors.length > 0) {
      return { data: [], error: `CSV parsing failed: ${criticalErrors[0].message}` };
    }
  }

  // Validate headers
  const headers = parseResult.meta.fields || [];
  const missingColumns = CSV_COLUMNS.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    return { data: [], error: `Missing columns: ${missingColumns.join(', ')}` };
  }

  const data = [];
  const errors = [];

  parseResult.data.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexed + header row

    // Skip completely empty rows
    if (Object.values(row).every(val => !val || val === '')) {
      return;
    }

    try {
      // Handle multi-line text in skills field (Papa Parse preserves newlines in quoted fields)
      const skills = row.skills || '';
      
      // Handle pipe-separated programs (empty string = empty array)
      const programs = row.programs ? row.programs.split('|').map(p => p.trim()).filter(p => p) : [];

      // Parse is_deceased (handle various boolean representations)
      const isDeceasedValue = (row.is_deceased || '').toString().toLowerCase().trim();
      const isDeceased = isDeceasedValue === 'true' || isDeceasedValue === 'yes' || isDeceasedValue === '1';

      // Parse total_hours as float, default to 0
      const totalHours = row.total_hours ? parseFloat(row.total_hours) : 0;

      const volunteer = {
        first_name: row.first_name?.trim() || '',
        last_name: row.last_name?.trim() || '',
        email: row.email?.trim() || '',
        phone: row.phone?.trim() || '',
        address: row.address?.trim() || '',
        city: row.city?.trim() || '',
        birth_date: row.birth_date?.trim() || '',
        gender: row.gender?.trim() || '',
        volunteer_type: row.volunteer_type?.trim() || 'community',
        status: row.status?.trim() || 'pending',
        start_date: row.start_date?.trim() || '',
        total_hours: isNaN(totalHours) ? 0 : totalHours,
        company_name: row.company_name?.trim() || '',
        school_name: row.school_name?.trim() || '',
        skills: skills,
        availability: row.availability?.trim() || '',
        programs: programs,
        emergency_contact_name: row.emergency_contact_name?.trim() || '',
        emergency_contact_phone: row.emergency_contact_phone?.trim() || '',
        crc: row.crc?.trim() || '',
        irc: row.irc?.trim() || '',
        ell_level: row.ell_level?.trim() || '',
        allergies: row.allergies?.trim() || '',
        food_restriction: row.food_restriction?.trim() || '',
        pictures_consent: row.pictures_consent?.trim() || '',
        how_heard: row.how_heard?.trim() || '',
        notes: row.notes?.trim() || '',
        pin_code: row.pin_code?.trim() || '',
        is_deceased: isDeceased,
        deceased_date: row.deceased_date?.trim() || '',
        corporate_members: []
      };

      // Validate required fields
      if (!volunteer.first_name || !volunteer.last_name) {
        errors.push(`Row ${rowNum}: Missing required field - first_name or last_name`);
      } else if (!['community', 'skilled', 'practicum', 'corporate', 'internal_placement'].includes(volunteer.volunteer_type)) {
        errors.push(`Row ${rowNum}: Invalid volunteer_type "${volunteer.volunteer_type}" - must be one of: community, skilled, practicum, corporate, internal_placement`);
      } else if (!['pending', 'active', 'occasional', 'inactive', 'suspended'].includes(volunteer.status)) {
        errors.push(`Row ${rowNum}: Invalid status "${volunteer.status}" - must be one of: pending, active, occasional, inactive, suspended`);
      } else {
        data.push(volunteer);
      }
    } catch (err) {
      errors.push(`Row ${rowNum}: Parse error - ${err.message}`);
    }
  });

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