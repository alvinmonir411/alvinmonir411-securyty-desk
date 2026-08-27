'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { apiClient } from '@/lib/api/client';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import {
  GraduationCap,
  User,
  Users,
  BookOpen,
  FileText,
  CreditCard,
  CheckCircle2,
  Printer,
  Search,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  IdCard,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { DocumentUpload } from '@/components/ui/document-upload';

const admissionFormSchema = z.object({
  // Step 1: Student
  firstName: z.string().min(2, 'নামের প্রথম অংশ আবশ্যক'),
  lastName: z.string().min(2, 'নামের শেষ অংশ আবশ্যক'),
  dateOfBirth: z.string().min(1, 'জন্ম তারিখ আবশ্যক'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  address: z.string().min(5, 'স্থায়ী ও বর্তমান ঠিকানা আবশ্যক'),

  // Step 2: Guardian
  parentName: z.string().min(2, 'অভিভাবকের নাম আবশ্যক'),
  parentEmail: z.string().email('সঠিক ইমেইল ঠিকানা দিন'),
  parentPhone: z.string().min(11, '১১ ডিজিটের মোবাইল নম্বর আবশ্যক'),

  // Step 3: Academic
  classId: z.string().min(1, 'ভর্তির জন্য শ্রেণী বেছে নিন'),
  previousSchool: z.string().optional(),
  previousGPA: z.string().optional(),

  // Step 4: Documents
  photoUrl: z.string().optional(),
  birthCertUrl: z.string().optional(),

  // Step 5: Payment Details
  paymentMethod: z.enum(['BKASH', 'NAGAD', 'ROCKET']).default('BKASH'),
  senderNumber: z.string().min(11, 'যে নম্বর থেকে টাকা পাঠানো হয়েছে তা দিন (১১ ডিজিট)'),
  transactionId: z.string().min(4, 'সঠিক Transaction ID (TrxID) লিখুন'),
  paymentScreenshotUrl: z.string().optional(),
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

export default function PublicAdmissionsPage() {
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState(1);
  const [submittedApp, setSubmittedApp] = useState<any>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  // Tracking State
  const [trackNumber, setTrackNumber] = useState('');
  const [trackedResult, setTrackedResult] = useState<any>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const { data: classes } = useQuery({
    queryKey: ['public-classes-admissions'],
    queryFn: async () => {
      const res = await apiClient.get('/academics/classes');
      return res.data.data || res.data;
    },
  });

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'MALE',
      address: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      classId: '',
      previousSchool: '',
      previousGPA: '',
      photoUrl: '',
      birthCertUrl: '',
      paymentMethod: 'BKASH',
      senderNumber: '',
      transactionId: '',
      paymentScreenshotUrl: '',
    },
  });

  const applyMutation = useMutation({
    mutationFn: (values: AdmissionFormValues) => apiClient.post('/admissions/apply', values),
    onSuccess: (res: any) => {
      const data = res.data?.data || res.data;
      setSubmittedApp(data);
      setStep(7);
      success('ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে!');
    },
    onError: (err: any) => toastError(err.response?.data?.message || 'আবেদন জমা দিতে সমস্যা হয়েছে'),
  });

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackNumber) return;
    setTrackingLoading(true);
    try {
      const res = await apiClient.get(`/admissions/track/${trackNumber.trim()}`);
      setTrackedResult(res.data?.data || res.data);
    } catch {
      toastError('আবেদন নম্বর পাওয়া যায়নি। দয়া করে সঠিক নম্বর দিন।');
      setTrackedResult(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any = [];
    if (step === 1) fieldsToValidate = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'address'];
    if (step === 2) fieldsToValidate = ['parentName', 'parentEmail', 'parentPhone'];
    if (step === 3) fieldsToValidate = ['classId'];
    if (step === 5) fieldsToValidate = ['paymentMethod', 'senderNumber', 'transactionId'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((prev) => prev + 1);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNumber(label);
    success(`${label} নম্বর কপি করা হয়েছে!`);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // Selected Class Name
  const selectedClassObj = classes?.find((c: any) => c.id === form.watch('classId'));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center space-y-2 mb-8 print:hidden">
            <Badge className="bg-primary text-primary-foreground border-none">ভর্তি সেশন ২০২৬-২০২৭</Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              অনলাইন শিক্ষার্থী ভর্তি পোর্টাল (Admission Portal)
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              নতুন ভর্তির আবেদন করুন অথবা পূর্বের আবেদনের স্ট্যাটাস ও প্রবেশপত্র যাচাই করুন।
            </p>
          </div>

          <Tabs defaultValue="apply" className="w-full">
            <TabsList className="grid grid-cols-2 max-w-md mx-auto mb-8 print:hidden">
              <TabsTrigger value="apply">নতুন আবেদন (New Application)</TabsTrigger>
              <TabsTrigger value="track">আবেদন ট্র্যাক করুন (Track Status)</TabsTrigger>
            </TabsList>

            {/* TAB 1: NEW MULTI-STEP APPLICATION */}
            <TabsContent value="apply">
              {step < 7 && (
                <div className="mb-8 print:hidden">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-2">
                    <span>ধাপ {step} এর ৬</span>
                    <span>{Math.round((step / 6) * 100)}% সম্পন্ন</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${(step / 6) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-6 text-center text-[10px] mt-2 font-medium text-muted-foreground gap-1">
                    <span className={step >= 1 ? 'text-primary font-bold' : ''}>১. শিক্ষার্থী</span>
                    <span className={step >= 2 ? 'text-primary font-bold' : ''}>২. অভিভাবক</span>
                    <span className={step >= 3 ? 'text-primary font-bold' : ''}>৩. শ্রেণী</span>
                    <span className={step >= 4 ? 'text-primary font-bold' : ''}>৪. সনদপত্র</span>
                    <span className={step >= 5 ? 'text-primary font-bold' : ''}>৫. ফি পেমেন্ট</span>
                    <span className={step >= 6 ? 'text-primary font-bold' : ''}>৬. যাচাই ও সাবমিট</span>
                  </div>
                </div>
              )}

              {/* STEP 7: CONFIRMATION & ADMIT CARD */}
              {step === 7 && submittedApp ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 print:hidden">
                    <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h2 className="text-xl font-bold">ভর্তি আবেদন সফলভাবে গৃহীত হয়েছে!</h2>
                    <p className="text-xs max-w-md mx-auto">
                      আপনার আবেদনটি কর্তৃপক্ষের পর্যালোচনার জন্য জমা হয়েছে। নিচের আবেদনপত্র ও প্রবেশপত্রটি সংরক্ষণ করুন।
                    </p>
                  </div>

                  {/* Printable Admit Slip */}
                  <Card className="border-2 shadow-lg print:border-none print:shadow-none">
                    <CardHeader className="border-b bg-muted/20 text-center pb-4">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <GraduationCap className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-extrabold uppercase tracking-wide">নোবেল রেসিডেনসিয়াল হাই স্কুল</h3>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono">পীরগাছা, রংপুর • স্থাপিত: ২০১০</p>
                      <Badge variant="outline" className="mx-auto mt-2 font-mono text-xs">
                        ভর্তি আবেদন রিসিট ও প্রবেশপত্র (ADMIT CARD)
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6 text-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 rounded-xl border">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">আবেদন ট্র্যাকিং নম্বর (Application No)</span>
                          <span className="font-mono text-lg font-bold text-primary">{submittedApp.applicationNumber}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">স্ট্যাটাস</span>
                          <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30">
                            SUBMITTED (আবেদন জমা হয়েছে)
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-[10px]">শিক্ষার্থীর নাম</span>
                          <strong className="text-foreground text-sm font-semibold">{submittedApp.firstName} {submittedApp.lastName}</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-[10px]">আবেদনকৃত শ্রেণী</span>
                          <strong className="text-foreground text-sm font-semibold">{selectedClassObj?.name || 'Class'}</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-[10px]">অভিভাবকের নাম</span>
                          <strong className="text-foreground font-medium">{submittedApp.parentName}</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-[10px]">অভিভাবকের মোবাইল</span>
                          <strong className="text-foreground font-mono">{submittedApp.parentPhone}</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-[10px]">আবেদন প্রসেসিং ফি</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-mono">৳ ৫০০.০০ (পরিশোধিত)</strong>
                        </div>
                        <div className="space-y-1">
                          <span className="text-muted-foreground block text-[10px]">আবেদনের তারিখ</span>
                          <strong className="text-foreground font-mono">{new Date().toLocaleDateString('bn-BD')}</strong>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4 border-t print:hidden">
                        <Button className="w-full" onClick={() => window.print()}>
                          <Printer className="mr-1.5 h-4 w-4" />
                          প্রবেশপত্র ও স্লিপ প্রিন্ট করুন (Print Slip)
                        </Button>
                        <Button variant="outline" onClick={() => { setStep(1); form.reset(); setSubmittedApp(null); }}>
                          নতুন আবেদন করুন
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold">
                      {step === 1 && 'ধাপ ১: শিক্ষার্থীর প্রাথমিক তথ্য (Student Information)'}
                      {step === 2 && 'ধাপ ২: অভিভাবক ও যোগাযোগের তথ্য (Guardian Information)'}
                      {step === 3 && 'ধাপ ৩: ভর্তির শ্রেণী ও পূর্ববর্তী পড়াশোনা (Academic Choice)'}
                      {step === 4 && 'ধাপ ৪: ছবি ও সনদপত্র আপলোড (Supporting Documents)'}
                      {step === 5 && 'ধাপ ৫: আবেদন ফি পরিশোধ (bKash / Nagad / Rocket Payment)'}
                      {step === 6 && 'ধাপ ৬: সম্পূর্ণ আবেদন যাচাই ও সাবমিট (Review & Submit)'}
                    </CardTitle>
                    <CardDescription>সঠিক ও নির্ভুল তথ্য প্রদান করে আবেদন সম্পন্ন করুন</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={form.handleSubmit((v) => applyMutation.mutate(v))} className="space-y-4">
                      {/* STEP 1: STUDENT */}
                      {step === 1 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="stFn">নামের প্রথম অংশ (First Name) *</Label>
                              <Input id="stFn" placeholder="যেমন: মো:" {...form.register('firstName')} />
                              {form.formState.errors.firstName && (
                                <p className="text-[11px] text-destructive">{form.formState.errors.firstName.message}</p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="stLn">নামের শেষ অংশ (Last Name) *</Label>
                              <Input id="stLn" placeholder="যেমন: রাফি আহমেদ" {...form.register('lastName')} />
                              {form.formState.errors.lastName && (
                                <p className="text-[11px] text-destructive">{form.formState.errors.lastName.message}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="stDob">জন্ম তারিখ (Date of Birth) *</Label>
                              <Input id="stDob" type="date" {...form.register('dateOfBirth')} />
                              {form.formState.errors.dateOfBirth && (
                                <p className="text-[11px] text-destructive">{form.formState.errors.dateOfBirth.message}</p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="stGen">লিঙ্গ (Gender) *</Label>
                              <Select id="stGen" {...form.register('gender')}>
                                <option value="MALE">ছাত্র (Male)</option>
                                <option value="FEMALE">ছাত্রী (Female)</option>
                                <option value="OTHER">অন্যান্য (Other)</option>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label htmlFor="stAddr">বর্তমান ও স্থায়ী ঠিকানা (Residential Address) *</Label>
                            <Input id="stAddr" placeholder="গ্রাম/রোড, ডাকঘর, উপজেলা, জেলা" {...form.register('address')} />
                            {form.formState.errors.address && (
                              <p className="text-[11px] text-destructive">{form.formState.errors.address.message}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* STEP 2: GUARDIAN */}
                      {step === 2 && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="prName">পিতা / মাতার নাম (Primary Guardian Name) *</Label>
                            <Input id="prName" placeholder="অভিভাবকের পূর্ণ নাম" {...form.register('parentName')} />
                            {form.formState.errors.parentName && (
                              <p className="text-[11px] text-destructive">{form.formState.errors.parentName.message}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="prPhone">অভিভাবকের মোবাইল নম্বর *</Label>
                              <Input id="prPhone" placeholder="017XXXXXXXX" {...form.register('parentPhone')} />
                              {form.formState.errors.parentPhone && (
                                <p className="text-[11px] text-destructive">{form.formState.errors.parentPhone.message}</p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="prEmail">অভিভাবকের ইমেইল এড্রেস *</Label>
                              <Input id="prEmail" type="email" placeholder="guardian@email.com" {...form.register('parentEmail')} />
                              {form.formState.errors.parentEmail && (
                                <p className="text-[11px] text-destructive">{form.formState.errors.parentEmail.message}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: ACADEMIC */}
                      {step === 3 && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <Label htmlFor="tgtCl">যে শ্রেণীতে ভর্তি হতে ইচ্ছুক (Target Class) *</Label>
                            <Select id="tgtCl" {...form.register('classId')}>
                              <option value="">-- শ্রেণী নির্বাচন করুন --</option>
                              {classes?.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                  {c.name} ({c.code})
                                </option>
                              ))}
                            </Select>
                            {form.formState.errors.classId && (
                              <p className="text-[11px] text-destructive">{form.formState.errors.classId.message}</p>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label htmlFor="prvSch">পূর্ববর্তী বিদ্যালয়ের নাম (যদি থাকে)</Label>
                              <Input id="prvSch" placeholder="যেমন: পীরগাছা সরকারি প্রাথমিক বিদ্যালয়" {...form.register('previousSchool')} />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="prvGpa">পূর্ববর্তী ক্লাসের জিপিএ / রোল নম্বর</Label>
                              <Input id="prvGpa" placeholder="যেমন: GPA 5.00 বা রোল ০১" {...form.register('previousGPA')} />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 4: DOCUMENTS */}
                      {step === 4 && (
                        <div className="space-y-5">
                          <ImageUpload
                            label="শিক্ষার্থীর পাসপোর্ট সাইজের ছবি (Cloudinary Photo Upload)"
                            value={form.watch('photoUrl')}
                            onChange={(url) => form.setValue('photoUrl', url)}
                            onRemove={() => form.setValue('photoUrl', '')}
                            folder="admissions/photos"
                            aspectRatio="square"
                            placeholderText="শিক্ষার্থীর পরিষ্কার রঙিন পাসপোর্ট ছবি আপলোড করুন"
                            helperText="সাদা বা এক রঙের ব্যাকগ্রাউন্ড সম্বলিত ছবি আপলোড করুন (সর্বোচ্চ ১০ মেগাবাইট)"
                          />

                          <DocumentUpload
                            label="জন্ম সনদপত্র বা পূর্ববর্তী ছাড়পত্র (Birth Certificate / Transfer Certificate)"
                            value={form.watch('birthCertUrl')}
                            onChange={(url) => form.setValue('birthCertUrl', url)}
                            onRemove={() => form.setValue('birthCertUrl', '')}
                            folder="admissions/certificates"
                            placeholderText="জন্ম নিবন্ধন সনদ বা স্কুল ছাড়পত্রের ছবি/পিডিএফ আপলোড করুন"
                            helperText="ডিজিটাল জন্ম সনদপত্র বা পূর্ববর্তী মার্কশিট (PDF বা ইমেজ ফাইল)"
                          />
                        </div>
                      )}

                      {/* STEP 5: APPLICATION FEE VIA BKASH / NAGAD / ROCKET */}
                      {step === 5 && (
                        <div className="space-y-5">
                          {/* Fee amount banner */}
                          <div className="rounded-2xl border-2 border-primary/20 p-4 bg-primary/5 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-muted-foreground block">আবেদন প্রসেসিং ফি</span>
                              <h3 className="text-xl font-extrabold text-foreground">৳ ৫০০.০০ (পাঁচশত টাকা)</h3>
                            </div>
                            <Badge className="bg-emerald-600 text-white text-xs">অনলাইন পেমেন্ট</Badge>
                          </div>

                          {/* Official Numbers Box */}
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-foreground">
                              স্কুলের অফিশিয়াল মোবাইল ব্যাংকিং নম্বরসমূহ (টাকা পাঠানোর নম্বর):
                            </Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {/* bKash */}
                              <div className="p-3.5 rounded-xl border border-pink-500/30 bg-pink-50/50 dark:bg-pink-950/20 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-pink-600 dark:text-pink-400 text-xs">বিকাশ (bKash)</span>
                                  <Badge variant="outline" className="text-[10px] border-pink-400 text-pink-600">Personal</Badge>
                                </div>
                                <div className="flex items-center justify-between bg-background p-2 rounded-lg border font-mono font-bold text-xs">
                                  <span>01711234567</span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleCopy('01711234567', 'বিকাশ')}
                                  >
                                    {copiedNumber === 'বিকাশ' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                  </Button>
                                </div>
                              </div>

                              {/* Nagad */}
                              <div className="p-3.5 rounded-xl border border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-orange-600 dark:text-orange-400 text-xs">নগদ (Nagad)</span>
                                  <Badge variant="outline" className="text-[10px] border-orange-400 text-orange-600">Personal</Badge>
                                </div>
                                <div className="flex items-center justify-between bg-background p-2 rounded-lg border font-mono font-bold text-xs">
                                  <span>01819876543</span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleCopy('01819876543', 'নগদ')}
                                  >
                                    {copiedNumber === 'নগদ' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                  </Button>
                                </div>
                              </div>

                              {/* Rocket */}
                              <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-purple-600 dark:text-purple-400 text-xs">রকেট (Rocket)</span>
                                  <Badge variant="outline" className="text-[10px] border-purple-400 text-purple-600">Personal</Badge>
                                </div>
                                <div className="flex items-center justify-between bg-background p-2 rounded-lg border font-mono font-bold text-xs">
                                  <span>017112345678</span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleCopy('017112345678', 'রকেট')}
                                  >
                                    {copiedNumber === 'রকেট' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* How to Pay Instructions */}
                          <div className="p-3.5 rounded-xl bg-muted/40 border text-[11px] space-y-1 text-muted-foreground">
                            <span className="font-bold text-foreground block">টাকা পরিশোধের নিয়মাবলী:</span>
                            <p>১. আপনার বিকাশ / নগদ / রকেট অ্যাপ বা ডায়াল করে <strong>Send Money</strong> অপশনে যান।</p>
                            <p>২. উপরে প্রদত্ত যেকোনো একটি নম্বরে নির্ধারিত <strong>৳ ৫০০.০০</strong> টাকা পাঠান।</p>
                            <p>৩. টাকা পাঠানোর পর এসএমএস থেকে প্রাপ্ত <strong>Transaction ID (TrxID)</strong> ও আপনার প্রেরকের নম্বর নিচে লিখে দিন এবং প্রয়োজনে স্ক্রিনশট আপলোড করুন।</p>
                          </div>

                          {/* Payment Submission Fields */}
                          <div className="space-y-4 pt-2 border-t">
                            <div className="space-y-1.5">
                              <Label className="text-xs font-semibold">কোন মাধ্যমে টাকা পাঠিয়েছেন? (Payment Method) *</Label>
                              <div className="grid grid-cols-3 gap-3">
                                {['BKASH', 'NAGAD', 'ROCKET'].map((m) => (
                                  <button
                                    type="button"
                                    key={m}
                                    onClick={() => form.setValue('paymentMethod', m as any)}
                                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                      form.watch('paymentMethod') === m
                                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-sm'
                                        : 'border-border bg-card hover:bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {m === 'BKASH' && 'বিকাশ (bKash)'}
                                    {m === 'NAGAD' && 'নগদ (Nagad)'}
                                    {m === 'ROCKET' && 'রকেট (Rocket)'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label htmlFor="sndNum">প্রেরকের মোবাইল নম্বর (যে নম্বর থেকে টাকা পাঠিয়েছেন) *</Label>
                                <Input
                                  id="sndNum"
                                  placeholder="01XXXXXXXXX"
                                  {...form.register('senderNumber')}
                                />
                                {form.formState.errors.senderNumber && (
                                  <p className="text-[11px] text-destructive">{form.formState.errors.senderNumber.message}</p>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <Label htmlFor="trxId">ট্রানজ্যাকশন আইডি (Transaction ID / TrxID) *</Label>
                                <Input
                                  id="trxId"
                                  placeholder="যেমন: 9KJH876TR2"
                                  className="font-mono uppercase"
                                  {...form.register('transactionId')}
                                />
                                {form.formState.errors.transactionId && (
                                  <p className="text-[11px] text-destructive">{form.formState.errors.transactionId.message}</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <ImageUpload
                                label="পেমেন্টের স্ক্রিনশট বা মানি রিসিট (Payment Screenshot / Slip)"
                                value={form.watch('paymentScreenshotUrl')}
                                onChange={(url) => form.setValue('paymentScreenshotUrl', url)}
                                onRemove={() => form.setValue('paymentScreenshotUrl', '')}
                                folder="admissions/payments"
                                placeholderText="বিকাশ/নগদ/রকেট পেমেন্ট সফল হওয়ার স্ক্রিনশট আপলোড করুন"
                                helperText="পেমেন্ট কনফার্মেশন এসএমএস বা অ্যাপের সফল স্ক্রিনশট"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* STEP 6: REVIEW & VERIFICATION */}
                      {step === 6 && (
                        <div className="space-y-4 text-xs">
                          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>আবেদনপত্র চূড়ান্তভাবে জমা দেওয়ার পূর্বে সকল তথ্য মনোযোগ দিয়ে যাচাই করুন।</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Student Box */}
                            <div className="p-4 rounded-xl border bg-card space-y-2">
                              <h4 className="font-bold text-foreground text-xs border-b pb-1 flex items-center gap-1.5 text-primary">
                                <User className="h-3.5 w-3.5" /> শিক্ষার্থীর বিবরণ
                              </h4>
                              {form.watch('photoUrl') && (
                                <img
                                  src={form.watch('photoUrl')}
                                  alt="Photo Preview"
                                  className="h-16 w-16 rounded-lg object-cover border mb-2"
                                />
                              )}
                              <p><strong>নাম:</strong> {form.watch('firstName')} {form.watch('lastName')}</p>
                              <p><strong>জন্ম তারিখ:</strong> {form.watch('dateOfBirth')}</p>
                              <p><strong>লিঙ্গ:</strong> {form.watch('gender') === 'MALE' ? 'ছাত্র' : 'ছাত্রী'}</p>
                              <p><strong>ঠিকানা:</strong> {form.watch('address')}</p>
                            </div>

                            {/* Guardian Box */}
                            <div className="p-4 rounded-xl border bg-card space-y-2">
                              <h4 className="font-bold text-foreground text-xs border-b pb-1 flex items-center gap-1.5 text-primary">
                                <Users className="h-3.5 w-3.5" /> অভিভাবকের বিবরণ
                              </h4>
                              <p><strong>অভিভাবক:</strong> {form.watch('parentName')}</p>
                              <p><strong>মোবাইল:</strong> <span className="font-mono">{form.watch('parentPhone')}</span></p>
                              <p><strong>ইমেইল:</strong> {form.watch('parentEmail')}</p>
                              <p><strong>ভর্তির শ্রেণী:</strong> <strong className="text-primary">{selectedClassObj?.name || 'Class'}</strong></p>
                            </div>
                          </div>

                          {/* Payment Review Box */}
                          <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                            <h4 className="font-bold text-foreground text-xs border-b border-primary/20 pb-1 flex items-center gap-1.5 text-primary">
                              <CreditCard className="h-3.5 w-3.5" /> ফি ও পেমেন্ট বিবরণ (Payment Details)
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-medium">
                              <div>
                                <span className="text-muted-foreground block text-[10px]">ফি এর পরিমাণ</span>
                                <strong className="text-foreground text-sm font-mono">৳ ৫০০.০০</strong>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">পেমেন্ট মেথড</span>
                                <Badge variant="outline">{form.watch('paymentMethod')}</Badge>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">প্রেরকের মোবাইল</span>
                                <span className="font-mono font-bold text-foreground">{form.watch('senderNumber')}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground block text-[10px]">TrxID</span>
                                <span className="font-mono font-bold text-primary uppercase">{form.watch('transactionId')}</span>
                              </div>
                            </div>
                            {form.watch('paymentScreenshotUrl') && (
                              <div className="pt-2">
                                <span className="text-[10px] text-muted-foreground block mb-1">সংযুক্ত পেমেন্ট স্ক্রিনশট:</span>
                                <a
                                  href={form.watch('paymentScreenshotUrl')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-semibold"
                                >
                                  📸 আপলোডকৃত স্ক্রিনশট দেখুন (Cloudinary)
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Wizard Navigation Buttons */}
                      <div className="flex justify-between pt-4 border-t">
                        {step > 1 ? (
                          <Button type="button" variant="outline" onClick={() => setStep((p) => p - 1)}>
                            <ArrowLeft className="mr-1.5 h-4 w-4" /> পূর্ববর্তী ধাপ
                          </Button>
                        ) : <div />}

                        {step < 6 ? (
                          <Button type="button" onClick={nextStep}>
                            পরবর্তী ধাপ <ArrowRight className="ml-1.5 h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            disabled={applyMutation.isPending}
                          >
                            {applyMutation.isPending ? 'জমা হচ্ছে...' : 'আবেদনপত্র চূড়ান্তভাবে জমা দিন (Submit)'}
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* TAB 2: TRACK APPLICATION STATUS */}
            <TabsContent value="track">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">আবেদনের বর্তমান অবস্থা যাচাই (Track Application)</CardTitle>
                  <CardDescription>
                    আবেদনের সময় প্রাপ্ত ট্র্যাকিং নম্বর (যেমন: ADM-2026-XXXXX) দিয়ে স্ট্যাটাস ও ফলাফল দেখুন
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <form onSubmit={handleTrack} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="যেমন: ADM-2026-12345"
                        value={trackNumber}
                        onChange={(e) => setTrackNumber(e.target.value)}
                        className="pl-9 font-mono uppercase text-xs"
                      />
                    </div>
                    <Button type="submit" disabled={trackingLoading || !trackNumber.trim()}>
                      {trackingLoading ? 'যাচাই হচ্ছে...' : 'যাচাই করুন'}
                    </Button>
                  </form>

                  {trackedResult && (
                    <div className="p-4 rounded-xl border bg-card space-y-4 text-xs">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b">
                        <div>
                          <h4 className="font-bold text-foreground text-sm">
                            {trackedResult.firstName} {trackedResult.lastName}
                          </h4>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            আবেদন নম্বর: {trackedResult.applicationNumber}
                          </span>
                        </div>
                        <Badge
                          variant={
                            trackedResult.status === 'APPROVED'
                              ? 'success'
                              : trackedResult.status === 'REJECTED'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="font-bold uppercase"
                        >
                          {trackedResult.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div>
                          <span className="text-muted-foreground block text-[10px]">ভর্তির শ্রেণী</span>
                          <strong className="text-foreground">{trackedResult.class?.name}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">অভিভাবকের মোবাইল</span>
                          <strong className="text-foreground font-mono">{trackedResult.parentPhone}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[10px]">আবেদনের তারিখ</span>
                          <strong className="text-foreground font-mono">
                            {new Date(trackedResult.createdAt).toLocaleDateString('bn-BD')}
                          </strong>
                        </div>
                      </div>

                      {trackedResult.status === 'APPROVED' && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-medium">
                          অভিনন্দন! আপনার ভর্তি আবেদনটি অনুমোদিত হয়েছে। বিদ্যালয়ের প্রশাসনিক কার্যালয়ে যোগাযোগ করুন।
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
