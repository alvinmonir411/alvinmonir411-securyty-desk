'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { success } = useToast();

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = (data: ContactValues) => {
    success('Thank you! Your inquiry has been sent to our Admissions & Administrative office.');
    form.reset();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <PublicHeader />

      <main className="flex-1 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <Badge className="bg-primary text-primary-foreground mb-2">Connect with Us</Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground">Campus Contact & Admissions Office</h1>
            <p className="text-xs text-muted-foreground max-w-xl mx-auto">
              We welcome prospective families, scholars, and visitors to our 25-acre campus.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Campus Info */}
            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Campus Address</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        Noble Residential High School Campus, Main Road
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Admissions Hotline</h4>
                      <p className="text-muted-foreground">+880 1711-234567 / +880 1819-876543</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Email Inquiries</h4>
                      <p className="text-muted-foreground">info@nobleschool.edu.bd</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-foreground text-sm">Office & Visiting Hours</h4>
                      <p className="text-muted-foreground">Saturday - Thursday: 8:00 AM - 4:30 PM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Map Placeholder */}
              <div className="rounded-2xl border overflow-hidden h-48 bg-muted/40 flex items-center justify-center text-center p-4">
                <div className="space-y-1">
                  <MapPin className="h-8 w-8 text-primary mx-auto" />
                  <span className="font-bold text-xs text-foreground block">Campus Location Map</span>
                  <p className="text-[10px] text-muted-foreground">Academic City Campus • Main Gates at East Wing</p>
                </div>
              </div>
            </div>

            {/* Inquiry Form */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Send Direct Inquiry</CardTitle>
                <CardDescription>Our admissions coordinator will get back to you within 24 business hours</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ctName">Full Name</Label>
                      <Input id="ctName" placeholder="Your name" {...form.register('name')} />
                      {form.formState.errors.name && (
                        <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ctEmail">Email Address</Label>
                      <Input id="ctEmail" type="email" placeholder="name@example.com" {...form.register('email')} />
                      {form.formState.errors.email && (
                        <p className="text-[11px] text-destructive">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="ctPhone">Phone (Optional)</Label>
                      <Input id="ctPhone" placeholder="+880 1711-XXXXXX" {...form.register('phone')} />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="ctSub">Inquiry Topic</Label>
                      <Input id="ctSub" placeholder="e.g. Grade 7 Admissions & Scholarship" {...form.register('subject')} />
                      {form.formState.errors.subject && (
                        <p className="text-[11px] text-destructive">{form.formState.errors.subject.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ctMsg">Message / Questions</Label>
                    <textarea
                      id="ctMsg"
                      rows={4}
                      placeholder="Please let us know your child's age, intended grade, and any specific questions..."
                      className="w-full rounded-lg border border-input bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      {...form.register('message')}
                    />
                    {form.formState.errors.message && (
                      <p className="text-[11px] text-destructive">{form.formState.errors.message.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="shadow-md">
                    <Send className="mr-1.5 h-4 w-4" /> Send Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
