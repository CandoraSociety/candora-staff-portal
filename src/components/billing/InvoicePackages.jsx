import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { FileText, Plus, ArrowLeft, Pencil, Upload } from 'lucide-react';
import { format } from 'date-fns';
import InvoicePackageDetail from './InvoicePackageDetail';

const STATUS_BADGES = {
  draft: { variant: 'secondary', color: 'text-slate-600' },
  ready_for_review: { variant: 'default', color: 'text-blue-600' },
  submitted: { variant: 'default', color: 'text-purple-600' },
  approved: { variant: 'outline', color: 'text-green-600' },
};

export default function InvoicePackages({ packages, configs, onCreatePackage, isLoading }) {
  const [view, setView] = useState('list'); // 'list' | 'generate' | 'detail'
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);
  
  const [formData, setFormData] = useState({
    billing_month: format(new Date(), 'yyyy-MM'),
    config_id: configs[0]?.id || '',
    crt_included: true,
    notes: '',
  });

  const handleCreatePackage = () => {
    if (!formData.billing_month || !formData.config_id) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    onCreatePackage(formData);
    setShowGenerator(false);
    setFormData({
      billing_month: format(new Date(), 'yyyy-MM'),
      config_id: configs[0]?.id || '',
      crt_included: true,
      notes: '',
    });
  };

  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedPackage(null);
  };

  if (view === 'detail' && selectedPackage) {
    return (
      <InvoicePackageDetail
        pkg={selectedPackage}
        configs={configs}
        onBack={handleBack}
      />
    );
  }

  if (showGenerator) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Create Invoice Package</CardTitle>
              <p className="text-sm text-slate-600 mt-1">Configure your billing package details</p>
            </div>
            <Button variant="outline" onClick={() => setShowGenerator(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billing_month">Billing Month</Label>
              <Input
                id="billing_month"
                type="month"
                value={formData.billing_month}
                onChange={(e) => setFormData({ ...formData, billing_month: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="config">Contract Configuration</Label>
              <Select
                value={formData.config_id}
                onValueChange={(value) => setFormData({ ...formData, config_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.config_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="crt_included"
              checked={formData.crt_included}
              onCheckedChange={(checked) => setFormData({ ...formData, crt_included: checked })}
            />
            <Label htmlFor="crt_included">Include CRT Report</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Add any notes about this billing package..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowGenerator(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePackage}>
              <Plus className="h-4 w-4 mr-2" />
              Create Package
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // List View
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Invoice Packages</h2>
        <Button onClick={() => setShowGenerator(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice Package
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <FileText className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No invoice packages created yet</h3>
            <p className="text-sm text-slate-500 mt-1">
              Create your first billing package to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handlePackageClick(pkg)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold">{pkg.package_number}</CardTitle>
                  <Badge
                    variant={STATUS_BADGES[pkg.status]?.variant || 'secondary'}
                    className={STATUS_BADGES[pkg.status]?.color}
                  >
                    {pkg.status.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <span>📅</span>
                  <span>{format(new Date(pkg.billing_month + '-01'), 'MMMM yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <span>👤</span>
                  <span>{pkg.prepared_by_name}</span>
                </div>
                <div className="border-t pt-2 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">CRT:</span>
                    <span className="font-medium">{pkg.crt_included ? 'Included' : 'Not included'}</span>
                  </div>
                  {pkg.paid_placements?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Placements:</span>
                      <span className="font-medium">{pkg.paid_placements.length}</span>
                    </div>
                  )}
                  {pkg.supporting_documents?.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Documents:</span>
                      <span className="font-medium">{pkg.supporting_documents.length}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}