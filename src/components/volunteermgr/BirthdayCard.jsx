import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Gift, Printer, Upload, X, Mail, MessageSquare, Loader2, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const BRAND = { navy: "#1a1a6e", yellow: "#f5c518", gold: "#e8b800" };
const LOGO_WIDE = "https://media.base44.com/images/public/6a15e361478575d63a95c265/ded6d4d7a_Candoralogo_noanniversary.png";
const LOGO_CIRCLE = "https://media.base44.com/images/public/6a15e361478575d63a95c265/562a66657_Candoracirclelogo_noanniversary.png";

const THEMES = [
  { id: "sunflower", label: "🌻 Sunflower", bg: "#fffbea", accent: BRAND.navy, headerBg: BRAND.navy, headerText: "#ffffff", bodyBg: "#fffde8", border: BRAND.yellow, bannerEmoji: "🌻🎂🌻" },
  { id: "navy_gold", label: "💛 Navy & Gold", bg: BRAND.navy, accent: BRAND.yellow, headerBg: BRAND.yellow, headerText: BRAND.navy, bodyBg: "#22226e", border: BRAND.yellow, bannerEmoji: "🎉🎊🎉" },
  { id: "celebration", label: "🎊 Celebration", bg: "#fff", accent: BRAND.navy, headerBg: `linear-gradient(135deg, ${BRAND.navy} 0%, #2d2d9e 100%)`, headerText: "#ffffff", bodyBg: "#f8f9ff", border: BRAND.navy, bannerEmoji: "🎈🎂🎈" },
  { id: "warm", label: "🎁 Warm Gold", bg: "#fffaf0", accent: "#b8860b", headerBg: `linear-gradient(135deg, #f5c518 0%, #e8a800 100%)`, headerText: BRAND.navy, bodyBg: "#fffff5", border: "#e8a800", bannerEmoji: "🌟🎁🌟" },
];

const PRESET_MESSAGES = [
  { label: "Warm & Grateful", body: "Wishing you a wonderful birthday filled with joy and happiness! Thank you for your incredible dedication as a volunteer — your kindness makes a real difference in our community. 🎉" },
  { label: "Community Star", body: "Happy Birthday! On your special day, we want to celebrate YOU and everything you bring to our community. Your time and generosity inspire everyone around you. 🎂" },
  { label: "Bright Wishes", body: "Sending warm birthday wishes your way! We are so grateful to have you as part of our volunteer family. May your day be as bright as the sunshine you bring to all of us! 🌻" },
  { label: "Year of Joy", body: "Happy Birthday! May this year bring you as much joy as you bring to everyone around you. Thank you for being such an amazing volunteer — we truly could not do it without you! 🌟" },
];

export default function BirthdayCard({ volunteer: initialVolunteer, open, onOpenChange }) {
  const [selectedVolunteer, setSelectedVolunteer] = useState(initialVolunteer || null);
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [message, setMessage] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [capturedCardData, setCapturedCardData] = useState(null);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);

  const { data: volunteers = [] } = useQuery({
    queryKey: ["volunteers-for-card"],
    queryFn: () => base44.entities.Volunteer.list("first_name", 200),
    enabled: open && !initialVolunteer,
  });

  useEffect(() => { setSelectedVolunteer(initialVolunteer || null); }, [initialVolunteer, open]);

  const firstName = selectedVolunteer?.first_name || "Volunteer";
  const fullName = `${selectedVolunteer?.first_name || ""} ${selectedVolunteer?.last_name || ""}`.trim() || "Volunteer";

  useEffect(() => {
    setMessage(`Dear ${firstName},\n\n${PRESET_MESSAGES[selectedPreset].body}\n\nWith warm appreciation,\nThe Candora Team`);
  }, [firstName, selectedPreset]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target.result);
    reader.readAsDataURL(file);
  };

  const captureCard = async () => {
    if (!previewRef.current) return null;
    return await html2canvas(previewRef.current, { useCORS: true, scale: 2, backgroundColor: null });
  };

  const handleShareEmail = async () => {
    toast.loading("Capturing card...");
    const canvas = await captureCard();
    if (!canvas) { toast.error("Could not capture card image"); return; }
    const cardImageData = canvas.toDataURL("image/png");
    const email = selectedVolunteer?.email;
    if (!email) { toast.error("Volunteer has no email address"); return; }
    setCapturedCardData({ cardImageData, email });
    toast.dismiss();
    setShowSendConfirm(true);
  };

  const confirmSendEmail = async () => {
    setShowSendConfirm(false);
    setEmailLoading(true);
    try {
      await base44.functions.invoke("sendBirthdayEmail", {
        to: capturedCardData.email,
        subject: `Happy Birthday, ${firstName}! 🎂`,
        cardImageData: capturedCardData.cardImageData,
        message,
        firstName,
      });
      toast.success(`Birthday card sent to ${capturedCardData.email}!`);
    } catch (error) {
      toast.error("Failed to send: " + error.message);
    } finally {
      setEmailLoading(false);
      setCapturedCardData(null);
      setScheduleMode(false);
      setScheduledDateTime("");
    }
  };

  const handleShareSMS = () => {
    const phone = selectedVolunteer?.phone ? selectedVolunteer.phone.replace(/\D/g, "") : "";
    window.open(`sms:${phone}?body=${encodeURIComponent(`🎂 Happy Birthday, ${firstName}!\n\n${message}`)}`, "_blank");
  };

  const handlePrint = () => {
    const theme = selectedTheme;
    const imgSection = uploadedImage ? `<div style="text-align:center;margin:16px 0;"><img src="${uploadedImage}" style="max-width:280px;max-height:200px;border-radius:12px;border:3px solid ${theme.border};object-fit:cover;" /></div>` : "";
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Birthday Card for ${fullName}</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Inter',sans-serif; background:#e8e8e8; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:40px; }
        .card { position:relative; width:600px; background:${theme.bg}; border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.25); border:3px solid ${theme.border}; }
        .header { background:${theme.headerBg}; color:${theme.headerText}; padding:32px 36px 24px; text-align:center; }
        .header-logo { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .logo-img { height:72px; } .circle-logo { height:80px; width:80px; border-radius:50%; }
        .banner-emoji { font-size:28px; letter-spacing:6px; }
        .header h1 { font-family:'Playfair Display',Georgia,serif; font-size:40px; font-weight:700; margin:10px 0 4px; }
        .header-sub { font-size:16px; opacity:0.85; font-weight:500; margin-top:6px; }
        .body { background:${theme.bodyBg}; padding:28px 36px 32px; }
        .message-box { background:rgba(255,255,255,0.85); border-left:5px solid ${theme.border}; border-radius:8px; padding:20px 22px; font-size:15px; line-height:1.85; color:#222; white-space:pre-wrap; }
        .footer { margin-top:24px; display:flex; align-items:center; justify-content:space-between; padding-top:18px; border-top:2px dashed ${theme.border}; }
        .footer-logo { height:48px; } .footer-text { font-size:12px; color:#888; text-align:right; line-height:1.5; }
        .stripe { height:8px; background:linear-gradient(90deg,${BRAND.yellow},${BRAND.navy},${BRAND.yellow}); }
        @media print { body { background:white; padding:0; } .card { box-shadow:none; } }
      </style></head><body>
      <div class="card">
        <div class="stripe"></div>
        <div class="header">
          <div class="header-logo"><img src="${LOGO_WIDE}" class="logo-img" /><img src="${LOGO_CIRCLE}" class="circle-logo" /></div>
          <div class="banner-emoji">${theme.bannerEmoji}</div>
          <h1>Happy Birthday!</h1>
          <p class="header-sub">A special message for ${fullName}</p>
        </div>
        <div class="body">
          ${imgSection}
          <div class="message-box">${message.replace(/\n/g, "<br/>")}</div>
          <div class="footer"><img src="${LOGO_WIDE}" class="footer-logo" /><div class="footer-text">Candora Volunteer Program<br/>Thank you for everything you do.</div></div>
        </div>
        <div class="stripe" style="background:linear-gradient(90deg,${BRAND.navy},${BRAND.yellow},${BRAND.navy});"></div>
      </div>
      <script>window.onload = () => { window.print(); }<\/script></body></html>`);
    printWindow.document.close();
  };

  const theme = selectedTheme;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              {selectedVolunteer ? `Birthday Card — ${fullName}` : "Create a Birthday Card"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {/* Controls */}
            <div className="space-y-4">
              {!initialVolunteer && (
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Volunteer</Label>
                  <Select value={selectedVolunteer?.id || ""} onValueChange={(id) => setSelectedVolunteer(volunteers.find((v) => v.id === id) || null)}>
                    <SelectTrigger><SelectValue placeholder="Choose a volunteer…" /></SelectTrigger>
                    <SelectContent>{volunteers.map((v) => <SelectItem key={v.id} value={v.id}>{v.first_name} {v.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Card Design</Label>
                <div className="grid grid-cols-2 gap-2">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => setSelectedTheme(t)}
                      className={`text-left text-xs rounded-lg px-3 py-2 border-2 transition-all font-medium ${selectedTheme.id === t.id ? "border-[#1a1a6e] bg-[#1a1a6e]/5 text-[#1a1a6e]" : "border-border hover:border-muted-foreground/40"}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Message Template</Label>
                <div className="space-y-1.5">
                  {PRESET_MESSAGES.map((p, i) => (
                    <button key={i} onClick={() => setSelectedPreset(i)}
                      className={`w-full text-left text-xs rounded-lg px-3 py-2 border transition-all ${selectedPreset === i ? "border-[#1a1a6e] bg-[#1a1a6e]/5 text-[#1a1a6e] font-semibold" : "border-border hover:border-muted-foreground/30 text-muted-foreground"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">Edit Message</Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="resize-none text-sm" />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Custom Image (optional)</Label>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                {uploadedImage ? (
                  <div className="relative inline-block">
                    <img src={uploadedImage} alt="uploaded" className="h-20 rounded-lg border object-cover" />
                    <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center"><X className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="gap-2 w-full" onClick={() => fileInputRef.current?.click()}><Upload className="w-3.5 h-3.5" /> Upload Photo or Image</Button>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block">Preview</Label>
              <div ref={previewRef} className="rounded-2xl overflow-hidden shadow-xl border-2 text-[10px]" style={{ borderColor: theme.border, background: theme.bg }}>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${BRAND.yellow}, ${BRAND.navy}, ${BRAND.yellow})` }} />
                <div style={{ background: theme.headerBg, color: theme.headerText, padding: "14px 18px 10px", textAlign: "center" }}>
                  <div className="flex items-center justify-between mb-2">
                    <img src={LOGO_WIDE} alt="Candora" style={{ height: 36 }} />
                    <img src={LOGO_CIRCLE} alt="Candora" style={{ height: 48, width: 48, borderRadius: "50%" }} />
                  </div>
                  <div style={{ fontSize: 16, letterSpacing: 4 }}>{theme.bannerEmoji}</div>
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 16, fontWeight: 700, margin: "4px 0 2px" }}>Happy Birthday!</div>
                  <div style={{ fontSize: 9, opacity: 0.85 }}>A message for {fullName}</div>
                </div>
                <div style={{ background: theme.bodyBg, padding: "12px 16px 14px" }}>
                  {uploadedImage && <div style={{ textAlign: "center", marginBottom: 10 }}><img src={uploadedImage} alt="custom" style={{ maxHeight: 80, maxWidth: "100%", borderRadius: 8, border: `2px solid ${theme.border}` }} /></div>}
                  <div style={{ background: "rgba(255,255,255,0.8)", borderLeft: `4px solid ${theme.border}`, borderRadius: 6, padding: "10px 12px", fontSize: 9, lineHeight: 1.8, color: "#333", whiteSpace: "pre-wrap" }}>{message}</div>
                  <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1.5px dashed ${theme.border}`, paddingTop: 8 }}>
                    <img src={LOGO_WIDE} alt="Candora" style={{ height: 22 }} />
                    <span style={{ fontSize: 8, color: "#888" }}>Candora Volunteer Program</span>
                  </div>
                </div>
                <div style={{ height: 5, background: `linear-gradient(90deg, ${BRAND.navy}, ${BRAND.yellow}, ${BRAND.navy})` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="outline" onClick={handleShareSMS} disabled={!selectedVolunteer} className="gap-2"><MessageSquare className="w-4 h-4" /> Text</Button>
            <Button variant="outline" onClick={handleShareEmail} disabled={!selectedVolunteer || emailLoading} className="gap-2">
              {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {emailLoading ? "Preparing…" : "Send Email"}
            </Button>
            <Button onClick={handlePrint} disabled={!selectedVolunteer} className="gap-2" style={{ background: BRAND.yellow, color: BRAND.navy }}>
              <Printer className="w-4 h-4" /> Print / Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent className="max-w-lg">
          <button onClick={() => { setShowSendConfirm(false); setCapturedCardData(null); }} className="absolute top-4 right-4 p-1 rounded text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Birthday Card</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>This will send the birthday card to <strong>{capturedCardData?.email}</strong>.</p>
                {capturedCardData?.cardImageData && (
                  <img src={capturedCardData.cardImageData} alt="Card preview" className="w-full max-h-48 object-contain border rounded-lg bg-muted/30" />
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setCapturedCardData(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSendEmail} style={{ background: BRAND.navy, color: "#fff" }}>
              <Mail className="w-4 h-4 mr-1" /> Send Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}