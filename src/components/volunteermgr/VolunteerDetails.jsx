import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Image, MapPin, Calendar, User, Phone, Mail, Building, GraduationCap, Shield, Heart, AlertCircle } from 'lucide-react';
import moment from 'moment';

export default function VolunteerDetails({ volunteer, isDeceased }) {
  if (!volunteer) return null;

  const Field = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="flex justify-between items-center py-1.5 border-b last:border-0">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          {Icon && <Icon className="w-3 h-3" />}
          {label}
        </span>
        <span className="text-sm font-medium max-w-[200px] truncate">{value}</span>
      </div>
    );
  };

  const TextField = ({ icon: Icon, label, value }) => {
    if (!value) return null;
    return (
      <div className="space-y-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          {Icon && <Icon className="w-3 h-3" />}
          {label}
        </span>
        <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">{value}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Volunteer Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</h3>
            <div className="space-y-1">
              <Field icon={Mail} label="Email" value={volunteer.email} />
              <Field icon={Phone} label="Phone" value={volunteer.phone} />
              <Field icon={MapPin} label="Address" value={volunteer.address} />
              <Field icon={MapPin} label="City" value={volunteer.city} />
              {volunteer.birth_date && (
                <Field icon={Calendar} label="Birth Date" value={moment(volunteer.birth_date).format('MMM D, YYYY')} />
              )}
              <Field icon={User} label="Gender" value={volunteer.gender} />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Emergency Contact
            </h3>
            <div className="space-y-1">
              <Field icon={User} label="Name" value={volunteer.emergency_contact_name} />
              <Field icon={Phone} label="Phone" value={volunteer.emergency_contact_phone} />
            </div>
          </div>

          {/* Volunteer Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Volunteer Information</h3>
            <div className="space-y-1">
              <Field icon={Building} label="Company" value={volunteer.company_name} />
              <Field icon={GraduationCap} label="School" value={volunteer.school_name} />
              {volunteer.start_date && (
                <Field icon={Calendar} label="Start Date" value={moment(volunteer.start_date).format('MMM D, YYYY')} />
              )}
              <Field icon={Calendar} label="PIN Code" value={volunteer.pin_code} />
              {isDeceased && volunteer.deceased_date && (
                <Field icon={Heart} label="Deceased Date" value={moment(volunteer.deceased_date).format('MMM D, YYYY')} />
              )}
            </div>
          </div>

          {/* Background Checks */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-3 h-3" /> Background Checks
            </h3>
            <div className="space-y-1">
              <Field icon={Shield} label="CRC" value={volunteer.crc} />
              <Field icon={Shield} label="IRC" value={volunteer.irc} />
            </div>
          </div>

          {/* Programs & Skills */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Programs & Skills</h3>
            {volunteer.programs && volunteer.programs.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Programs</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {volunteer.programs.map((prog, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{prog}</Badge>
                  ))}
                </div>
              </div>
            )}
            <TextField icon={Heart} label="Skills" value={volunteer.skills} />
            <TextField icon={Calendar} label="Availability" value={volunteer.availability} />
          </div>

          {/* Dietary & Medical */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dietary & Medical</h3>
            <div className="space-y-1">
              <Field icon={AlertCircle} label="Allergies" value={volunteer.allergies} />
              <Field icon={AlertCircle} label="Food Restrictions" value={volunteer.food_restriction} />
            </div>
          </div>

          {/* Other Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Other Information</h3>
            <div className="space-y-1">
              <Field icon={GraduationCap} label="ELL Level" value={volunteer.ell_level} />
              <Field icon={Image} label="Pictures Consent" value={volunteer.pictures_consent} />
              <TextField icon={FileText} label="How They Heard" value={volunteer.how_heard} />
            </div>
          </div>

          {/* Notes */}
          {volunteer.notes && (
            <div className="md:col-span-2 space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-3 h-3" /> Notes
              </h3>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">{volunteer.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}