import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, BookOpen, GraduationCap, ClipboardList, ArrowLeft, ExternalLink } from 'lucide-react';
import moment from 'moment';

export default function PortalDocuments({ volunteerId, onBack }) {
  if (!onBack) onBack = () => {};
  
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['volunteer-documents'],
    queryFn: () => base44.entities.VolunteerDocument.list('-upload_date'),
  });

  const { data: trainingRecords = [] } = useQuery({
    queryKey: ['volunteer-training-all'],
    queryFn: () => base44.entities.Training.list('-created_date'),
  });

  const { data: trainingRecordsPersonal = [] } = useQuery({
    queryKey: ['volunteer-training-records', volunteerId],
    queryFn: () => base44.entities.TrainingRecord.filter({ volunteer_id: volunteerId }),
    enabled: !!volunteerId,
  });

  // Filter documents by category
  const filteredDocuments = documents.filter(doc => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'orientation') return doc.document_type === 'orientation';
    if (selectedCategory === 'training') return doc.document_type === 'training' || doc.document_type === 'other';
    if (selectedCategory === 'resources') return doc.document_type === 'handbook_signed' || doc.document_type === 'policy_signed';
    return true;
  });

  const categories = [
    { value: 'all', label: 'All Documents', icon: FileText },
    { value: 'orientation', label: 'Orientation', icon: BookOpen },
    { value: 'training', label: 'Training Materials', icon: GraduationCap },
    { value: 'resources', label: 'Resources & Policies', icon: ClipboardList },
  ];

  const getCategoryIcon = (type) => {
    switch (type) {
      case 'orientation': return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'training': return <GraduationCap className="w-5 h-5 text-green-600" />;
      case 'handbook_signed': 
      case 'policy_signed': return <ClipboardList className="w-5 h-5 text-purple-600" />;
      default: return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getCategoryBadge = (type) => {
    const labels = {
      orientation: 'Orientation',
      application: 'Application',
      offer_letter: 'Offer Letter',
      contract: 'Contract',
      handbook_signed: 'Policy',
      policy_signed: 'Policy',
      confidentiality: 'Confidentiality',
      training: 'Training',
      other: 'Resource',
    };
    return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className="w-full max-w-5xl shadow-2xl border-0">
      <CardHeader className="bg-gradient-to-r from-accent/20 to-accent/5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground text-2xl font-display font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-accent" />
            Volunteer Resources & Documents
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 border-b pb-4">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                className="gap-2"
                onClick={() => setSelectedCategory(cat.value)}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Documents Available</h3>
            <p className="text-muted-foreground">Check back later for new resources and training materials!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredDocuments.map(doc => (
              <div
                key={doc.id}
                className="border rounded-lg p-5 bg-card hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      {getCategoryIcon(doc.document_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {doc.title}
                      </h3>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {getCategoryBadge(doc.document_type)}
                      </Badge>
                      {doc.upload_date && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Uploaded {moment(doc.upload_date).format('MMM D, YYYY')}
                        </p>
                      )}
                      {doc.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {doc.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {doc.file_url ? (
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1 gap-2" variant="secondary">
                      <ExternalLink className="w-4 h-4" />
                      View Online
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Training Progress */}
        {trainingRecordsPersonal && trainingRecordsPersonal.length > 0 && (
          <div className="border-t pt-6">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              My Training Progress
            </h4>
            <div className="grid gap-3">
              {trainingRecordsPersonal.map(record => {
                const training = trainingRecords.find(t => t.id === record.training_id);
                const completedModules = record.completed_modules?.length || 0;
                const totalModules = training?.modules?.length || 0;
                const isCompleted = record.status === 'completed';

                return (
                  <div
                    key={record.id}
                    className={`border rounded-lg p-4 ${
                      isCompleted ? 'bg-green-50 border-green-200' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-semibold text-foreground">
                          {training?.title || record.pathway_title || 'Training'}
                        </h5>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            {completedModules} / {totalModules} modules completed
                          </span>
                          <Badge variant={isCompleted ? 'default' : 'secondary'}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                        {record.completion_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Completed on {moment(record.completion_date).format('MMM D, YYYY')}
                          </p>
                        )}
                      </div>
                      {isCompleted && (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Button variant="outline" onClick={onBack} className="w-full mt-6 gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Button>
      </CardContent>
    </Card>
  );
}