import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const WORKERS = [
  { email: "priscilla@candorasociety.com", full_name: "Priscilla" },
  { email: "lola@candorasociety.com", full_name: "Lola" },
  { email: "john@candorasociety.com", full_name: "John" },
  { email: "Dawn.williston@candorasociety.com", full_name: "Dawn" },
  { email: "olena@candorasociety.com", full_name: "Olena" },
];

const SERVICE_TYPES = [
  { value: "direct_to_employment", label: "Direct to Employment (DEA)" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "external_referral", label: "External Referral" },
  { value: "internal_referral", label: "Internal Referral" },
  { value: "not_eligible", label: "Not Eligible" },
];

const RESIDENCY_STATUSES = [
  { value: "canadian_citizen", label: "Canadian Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "protected_person", label: "Protected Person" },
  { value: "convention_refugee", label: "Convention Refugee" },
  { value: "refugee_claimant", label: "Refugee Claimant" },
  { value: "temporary_resident", label: "Temporary Resident" },
  { value: "work_permit", label: "Work Permit" },
  { value: "study_permit", label: "Study Permit" },
  { value: "visitor", label: "Visitor" },
  { value: "other", label: "Other" },
];

const CLB_LEVELS = [
  { value: "clb_1", label: "CLB 1" },
  { value: "clb_2", label: "CLB 2" },
  { value: "clb_3", label: "CLB 3" },
  { value: "clb_4", label: "CLB 4" },
  { value: "clb_5", label: "CLB 5" },
  { value: "clb_6", label: "CLB 6" },
  { value: "clb_7", label: "CLB 7" },
  { value: "clb_8", label: "CLB 8" },
  { value: "clb_9", label: "CLB 9" },
  { value: "clb_10", label: "CLB 10" },
  { value: "clb_11", label: "CLB 11" },
  { value: "clb_12", label: "CLB 12" },
  { value: "native_english_french", label: "Native English/French" },
];

const EMPLOYMENT_STATUSES = [
  { value: "E-RF", label: "Employed - Regular Full-time" },
  { value: "E-UF", label: "Employed - Unregular Full-time" },
  { value: "E-PT", label: "Employed - Part-time" },
  { value: "UE", label: "Unemployed" },
  { value: "UE-LA", label: "Unemployed - Looking for Work" },
  { value: "UE-S", label: "Unemployed - Student" },
  { value: "NA", label: "Not Applicable" },
];

const REFERRAL_SOURCES = [
  { value: "self", label: "Self" },
  { value: "family_friend", label: "Family/Friend" },
  { value: "school", label: "School" },
  { value: "employer", label: "Employer" },
  { value: "external_agency", label: "External Agency" },
  { value: "alberta_works", label: "Alberta Works" },
  { value: "other", label: "Other" },
];

export default function IntakePage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    sex: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Alberta",
    zip: "",
    compass_hsid: "",
    residency_status: "",
    clb_level: "",
    employment_status: "",
    has_vehicle: "",
    referral_source: "",
    service_type: "",
    assigned_worker: "",
    career_objectives: "",
    employment_history: "",
    intake_notes: "",
    intake_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const worker = WORKERS.find(w => w.email === formData.assigned_worker);
      
      const client = await base44.entities.Client.create({
        ...formData,
        assigned_worker_name: worker?.full_name || "",
        status: "new",
      });

      toast.success("Client intake completed!");
      navigate(`/client/${client.id}`);
    } catch (error) {
      toast.error("Failed to create client: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#1a237e]">New Client Intake</h1>
              <p className="text-sm text-slate-600">Register a new client in the system</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              <div>
                <Label>Sex</Label>
                <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>Province</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Case Information */}
          <Card>
            <CardHeader>
              <CardTitle>Case Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Compass HSID #</Label>
                <Input
                  value={formData.compass_hsid}
                  onChange={(e) => setFormData({ ...formData, compass_hsid: e.target.value })}
                  placeholder="Government of Alberta ID"
                />
              </div>
              <div>
                <Label>Residency Status</Label>
                <Select value={formData.residency_status} onValueChange={(value) => setFormData({ ...formData, residency_status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESIDENCY_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>CLB Level</Label>
                <Select value={formData.clb_level} onValueChange={(value) => setFormData({ ...formData, clb_level: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLB_LEVELS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Employment Status</Label>
                <Select value={formData.employment_status} onValueChange={(value) => setFormData({ ...formData, employment_status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Has Vehicle</Label>
                <Select value={formData.has_vehicle} onValueChange={(value) => setFormData({ ...formData, has_vehicle: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no_has_license">No (has license)</SelectItem>
                    <SelectItem value="no_no_license">No (no license)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Referral Source</Label>
                <Select value={formData.referral_source} onValueChange={(value) => setFormData({ ...formData, referral_source: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {REFERRAL_SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Type *</Label>
                <Select value={formData.service_type} onValueChange={(value) => setFormData({ ...formData, service_type: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assigned Worker *</Label>
                <Select value={formData.assigned_worker} onValueChange={(value) => setFormData({ ...formData, assigned_worker: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKERS.map((w) => (
                      <SelectItem key={w.email} value={w.email}>{w.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Intake Date</Label>
                <Input
                  type="date"
                  value={formData.intake_date}
                  onChange={(e) => setFormData({ ...formData, intake_date: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader>
              <CardTitle>Career Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Career Objectives</Label>
                <Textarea
                  value={formData.career_objectives}
                  onChange={(e) => setFormData({ ...formData, career_objectives: e.target.value })}
                  rows={3}
                  placeholder="Client's career goals and objectives"
                />
              </div>
              <div>
                <Label>Employment History</Label>
                <Textarea
                  value={formData.employment_history}
                  onChange={(e) => setFormData({ ...formData, employment_history: e.target.value })}
                  rows={3}
                  placeholder="Previous work experience"
                />
              </div>
              <div>
                <Label>Intake Notes</Label>
                <Textarea
                  value={formData.intake_notes}
                  onChange={(e) => setFormData({ ...formData, intake_notes: e.target.value })}
                  rows={3}
                  placeholder="Additional notes from intake session"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/")}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1a237e] hover:bg-[#1a237e]/90">
              Create Client
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}