'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { PublicHeader } from '@/components/public/public-header';
import { PublicFooter } from '@/components/public/public-footer';
import { NewsTicker } from '@/components/public/news-ticker';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  ChevronLeft,
  Quote,
  Search,
  MapPin,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Sparkles,
  GraduationCap,
  BookOpen,
  Award,
  FileText,
  Calendar,
  Users,
  ShieldCheck,
  Activity,
  Layers,
  FileCheck,
  ChevronDown,
  Building,
} from 'lucide-react';

export default function PublicHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeAcademicTab, setActiveAcademicTab] = useState(0);
  const [rollNumber, setRollNumber] = useState('');
  const [regNumber, setRegNumber] = useState('');

  // Default Real School Hero Slides from public campus directory
  const defaultHeroSlides = [
    {
      title: 'INSPIRING MINDS.\nBUILDING FUTURES.',
      subtitle: 'A disciplined, modern and student-centered learning environment where knowledge, character and creativity grow together.',
      imageUrl: '/787124177_2051232472934207_3472095284671851725_n.jpg',
      buttonText: 'Explore Academics',
      buttonLink: '/academics',
    },
    {
      title: 'EXCELLENCE IN\nNCTB EDUCATION.',
      subtitle: 'Structured classroom learning, experienced educators, and complete guidance for secondary academic success.',
      imageUrl: '/778985014_1018608747889352_6428572593389947367_n.jpg',
      buttonText: 'Apply for Admission',
      buttonLink: '/admissions',
    },
    {
      title: 'CHARACTER, LEADERSHIP\n& INTEGRITY.',
      subtitle: 'Developing confident, responsible and ethical future leaders through academic and co-curricular guidance.',
      imageUrl: '/786656880_1616644293215292_2836054805930890432_n.jpg',
      buttonText: 'Visit Our Campus',
      buttonLink: '/contact',
    },
  ];

  // Queries
  const { data: heroSlides } = useQuery({
    queryKey: ['public-hero-slides'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/cms/hero-slides');
        const apiData = res.data.data || res.data;
        return apiData && apiData.length > 0 ? apiData : defaultHeroSlides;
      } catch {
        return defaultHeroSlides;
      }
    },
  });

  const { data: notices } = useQuery({
    queryKey: ['public-notices'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/cms/notices');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: news } = useQuery({
    queryKey: ['public-news'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/cms/news');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: events } = useQuery({
    queryKey: ['public-events'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/cms/events');
        return res.data.data || res.data || [];
      } catch {
        return [];
      }
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['public-db-stats'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/academics/dashboard-stats');
        return res.data.data || res.data;
      } catch {
        return null;
      }
    },
  });

  const slides = heroSlides || defaultHeroSlides;

  // Auto rotate hero slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const academicLinks = [
    { title: 'Curriculum & Courses', desc: 'NCTB National Curriculum for Primary & Secondary levels (Class 1-10).', link: '/academics' },
    { title: 'Class Routine', desc: 'Class-wise weekly timetables and section period schedules.', link: '/routine' },
    { title: 'Examination Assessment', desc: 'Term structure, assessment criteria, and grading rules.', link: '/results' },
    { title: 'Class Syllabus', desc: 'Subject-wise term syllabus breakdown for each grade.', link: '/syllabus' },
    { title: 'Textbooks & Booklist', desc: 'NCTB approved textbook list and recommended reference books.', link: '/booklist' },
    { title: 'Academic Results', desc: 'Search and inspect published student result transcripts.', link: '/results' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-primary selection:text-white font-sans antialiased">
      {/* Top Header & Main Navbar */}
      <PublicHeader />

      {/* Breaking News Ticker */}
      <NewsTicker notices={notices} />

      <main className="flex-1">
        {/* 1. CINEMATIC EDITORIAL HERO SECTION (650px-750px full-width) */}
        <section className="relative w-full h-[680px] sm:h-[720px] bg-slate-950 text-white overflow-hidden flex items-center">
          {slides.map((slide: any, idx: number) => {
            const isActive = idx === currentSlide;
            return (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none hidden'
                }`}
              >
                {/* Background Photo & Crisp Overlay */}
                <div className="absolute inset-0">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                </div>

                {/* Editorial Left Content */}
                <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 h-full flex flex-col justify-center">
                  <div className="max-w-3xl space-y-6">
                    <div className="flex items-center gap-3">
                      <span className="h-px w-10 bg-accent" />
                      <span className="text-xs font-mono tracking-widest text-slate-300 uppercase font-bold">
                        NOBLE RESIDENTIAL HIGH SCHOOL • PIRGACHHA, RANGPUR
                      </span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none uppercase text-white font-serif whitespace-pre-line">
                      {slide.title || 'INSPIRING MINDS.\nBUILDING FUTURES.'}
                    </h1>

                    <p className="text-base sm:text-lg text-slate-200 max-w-xl font-light leading-relaxed">
                      {slide.subtitle ||
                        'A disciplined, modern and student-centered learning environment where knowledge, character and creativity grow together.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 pt-4">
                      <Link href={slide.buttonLink || '/academics'}>
                        <button className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-8 py-3.5 rounded-lg shadow-xl inline-flex items-center gap-2 tracking-wide transition-colors">
                          <span>{slide.buttonText || 'Explore Academics'}</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </Link>
                      <Link href="/admissions">
                        <button className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-8 py-3.5 rounded-lg border border-white/40 backdrop-blur-md inline-flex items-center gap-2 tracking-wide transition-colors">
                          Apply for Admission
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Editorial Slide Navigation & Scroll Down Indicator */}
          <div className="absolute bottom-8 left-6 sm:left-12 z-20 flex items-center gap-8">
            <div className="flex items-center gap-2">
              {slides.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 transition-all duration-300 ${
                    idx === currentSlide ? 'w-10 bg-accent' : 'w-4 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-mono tracking-widest uppercase">
              <ChevronDown className="h-4 w-4 animate-bounce text-accent" />
              <span>Scroll Down</span>
            </div>
          </div>
        </section>

        {/* 2. HORIZONTAL STATISTICS STRIP */}
        <section className="bg-slate-900 text-white border-b border-slate-800 py-12">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400 tracking-widest uppercase block">01 / STUDENTS</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                    {stats ? stats.totalStudents.toLocaleString() : '0'}
                  </span>
                  <span className="text-xs text-slate-300 font-sans font-bold">Students</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Enrolled active students</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400 tracking-widest uppercase block">02 / TEACHERS</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                    {stats ? stats.totalTeachers.toLocaleString() : '0'}
                  </span>
                  <span className="text-xs text-slate-300 font-sans font-bold">Teachers</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Academic teaching staff</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400 tracking-widest uppercase block">03 / CLASSES</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                    10
                  </span>
                  <span className="text-xs text-slate-300 font-sans font-bold">Classes</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Class 1 to Class 10</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono text-slate-400 tracking-widest uppercase block">04 / ESTABLISHED</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
                    2010
                  </span>
                  <span className="text-xs text-slate-300 font-sans font-bold">Estd.</span>
                </div>
                <p className="text-xs text-slate-400 font-light">Pirgachha, Rangpur</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. ABOUT SCHOOL (50/50 Asymmetrical Editorial Composition) */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              {/* Left Large Photography */}
              <div className="lg:col-span-6 relative">
                <div className="relative z-10 overflow-hidden shadow-2xl">
                  <img
                    src="/786656880_1616644293215292_2836054805930890432_n.jpg"
                    alt="Noble Residential High School Students"
                    className="w-full h-[520px] object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-primary/10 -z-0 hidden sm:block" />
              </div>

              {/* Right Editorial Copy & Numbered Highlights */}
              <div className="lg:col-span-6 space-y-8">
                <div className="space-y-3">
                  <span className="text-xs font-mono tracking-widest uppercase text-accent font-bold">ABOUT OUR INSTITUTION</span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-serif leading-tight">
                    Nurturing Knowledge, Character & Confidence
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-slate-600 font-light leading-relaxed">
                  Noble Residential High School is committed to providing a balanced, modern, and disciplined academic environment. Located in Pirgachha, Rangpur, we equip students with strong moral principles, analytical skills, and intellectual depth to excel in national secondary education and beyond.
                </p>

                {/* 3 Numbered Text Highlights (No cards!) */}
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-mono font-bold text-accent pt-1">01</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Academic Excellence</h4>
                      <p className="text-xs text-slate-500 font-light">Strict NCTB curriculum adherence with structured evaluation.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="text-xs font-mono font-bold text-accent pt-1">02</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Character Development</h4>
                      <p className="text-xs text-slate-500 font-light">Ethical guidance, discipline, and mutual respect in daily life.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <span className="text-xs font-mono font-bold text-accent pt-1">03</span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Future Ready Learning</h4>
                      <p className="text-xs text-slate-500 font-light">Science literacy, computer skills, and practical problem solving.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href="/about" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">
                    <span>Learn More About Campus</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. MISSION / VISION (Full-Width Visual Section with Strong Dark Background) */}
        <section className="bg-slate-950 text-white py-24 sm:py-32 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 relative z-10 space-y-16">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono tracking-widest text-accent uppercase font-bold">OUR FOUNDATION</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
                What We Stand For
              </h2>
            </div>

            {/* Editorial Split for Mission & Vision */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 border-t border-slate-800 pt-12">
              <div className="space-y-4">
                <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">MISSION STATEMENT</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">Cultivating Intellect & Moral Integrity</h3>
                <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                  To deliver quality secondary education following the National Curriculum, instilling moral values, critical thinking, and social responsibility in every learner so they become capable global citizens.
                </p>
              </div>

              <div className="space-y-4">
                <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">VISION FOR THE FUTURE</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white">A Benchmark Institution in Bangladesh</h3>
                <p className="text-sm sm:text-base text-slate-300 font-light leading-relaxed">
                  To be recognized as a premier educational institution that produces compassionate, knowledgeable, and confident leaders who contribute meaningfully to society and the nation.
                </p>
              </div>
            </div>

            {/* Minimal Horizontal List for Core Values */}
            <div className="border-t border-slate-800 pt-8 flex flex-wrap items-center justify-between gap-6 text-xs font-mono text-slate-400 tracking-wider uppercase">
              <span className="text-white font-bold">CORE VALUES:</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> DISCIPLINE</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> HONESTY</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> RESPECT</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> RESPONSIBILITY</span>
              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> EXCELLENCE</span>
            </div>
          </div>
        </section>

        {/* 5. WHY CHOOSE US (Image-Led Section + Numbered List, No 6 Cards!) */}
        <section className="py-24 sm:py-32 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              {/* Left Heading & Numbered Feature List */}
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-3">
                  <span className="text-xs font-mono tracking-widest uppercase text-accent font-bold">WHY CHOOSE US</span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-serif">
                    MORE THAN EDUCATION.
                  </h2>
                  <p className="text-sm text-slate-600 font-light">
                    A supportive environment designed for comprehensive academic and personal growth.
                  </p>
                </div>

                <div className="divide-y divide-slate-200 border-y border-slate-200">
                  <div className="py-5 flex items-start gap-6">
                    <span className="text-sm font-mono font-bold text-accent">01</span>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Quality NCTB Curriculum</h4>
                      <p className="text-xs text-slate-600 font-light">Strong academic grounding in all core subjects for Class 1 to Class 10.</p>
                    </div>
                  </div>

                  <div className="py-5 flex items-start gap-6">
                    <span className="text-sm font-mono font-bold text-accent">02</span>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Dedicated Faculty & Mentors</h4>
                      <p className="text-xs text-slate-600 font-light">Experienced educators providing individual academic care and supervision.</p>
                    </div>
                  </div>

                  <div className="py-5 flex items-start gap-6">
                    <span className="text-sm font-mono font-bold text-accent">03</span>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Student & Leadership Development</h4>
                      <p className="text-xs text-slate-600 font-light">Fostering confidence, debate, science projects, and cultural participation.</p>
                    </div>
                  </div>

                  <div className="py-5 flex items-start gap-6">
                    <span className="text-sm font-mono font-bold text-accent">04</span>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-slate-900">Safe & Disciplined Environment</h4>
                      <p className="text-xs text-slate-600 font-light">Campus safety, regular attendance tracking, and ethical guidance.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Large Campus Image */}
              <div className="lg:col-span-5">
                <div className="overflow-hidden shadow-2xl rounded-2xl">
                  <img
                    src="/778985014_1018608747889352_6428572593389947367_n.jpg"
                    alt="Classroom Instruction at Noble School"
                    className="w-full h-[550px] object-cover hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. ACADEMIC EXCELLENCE (Editorial Split Layout: Photo on Left, Clean Vertical Nav List on Right) */}
        <section className="py-24 sm:py-32 bg-white border-t border-slate-200">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-12">
            <div className="space-y-3">
              <span className="text-xs font-mono tracking-widest uppercase text-accent font-bold">ACADEMIC PROGRAM</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-serif">
                Academic Excellence & Curriculum
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Large Academic Image */}
              <div className="lg:col-span-6">
                <div className="overflow-hidden shadow-xl rounded-2xl border border-slate-100">
                  <img
                    src="/786159099_1382471063266617_3694329204075790563_n.jpg"
                    alt="Academic Programs"
                    className="w-full h-[460px] object-cover"
                  />
                </div>
              </div>

              {/* Right Clean Vertical Navigation List */}
              <div className="lg:col-span-6 divide-y divide-slate-200">
                {academicLinks.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.link}
                    className="py-5 block group hover:pl-2 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 font-light mt-0.5">{item.desc}</p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all shrink-0 ml-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 7. HEADMASTER MESSAGE (Premium Portrait + Quote Composition, Rendered from CMS/Default) */}
        <section className="py-24 sm:py-32 bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Large Portrait */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative">
                  <div className="w-72 h-80 sm:w-80 sm:h-96 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl">
                    <img
                      src="/787124177_2051232472934207_3472095284671851725_n.jpg"
                      alt="Headmaster Portrait"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 bg-accent text-white px-4 py-2 text-xs font-mono font-bold tracking-widest uppercase">
                    ESTD. 2010
                  </div>
                </div>
              </div>

              {/* Right Large Quote Typography */}
              <div className="lg:col-span-7 space-y-6">
                <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">MESSAGE FROM THE HEADMASTER</span>
                <Quote className="h-12 w-12 text-accent/40" />
                <blockquote className="text-xl sm:text-3xl font-serif leading-relaxed text-slate-100 font-light italic">
                  “Education is not only about academic success; it is about developing responsible, confident and compassionate individuals who are prepared to overcome future challenges.”
                </blockquote>
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-lg font-bold text-white">Headmaster</h4>
                  <p className="text-xs font-mono text-slate-400">Noble Residential High School • Pirgachha, Rangpur</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. STUDENT LIFE (Visual Asymmetrical Masonry Photo Composition) */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-widest uppercase text-accent font-bold">STUDENT LIFE</span>
                <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-serif">
                  Life Beyond the Classroom
                </h2>
              </div>
              <Link href="/gallery" className="text-xs font-mono font-bold text-primary uppercase tracking-wider hover:underline">
                Explore Student Gallery →
              </Link>
            </div>

            {/* Asymmetrical Photo Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Large Featured Photo */}
              <div className="md:col-span-7 relative overflow-hidden rounded-2xl shadow-xl group h-[380px]">
                <img
                  src="/786656880_1616644293215292_2836054805930890432_n.jpg"
                  alt="Campus Life"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 text-white space-y-1">
                  <span className="text-[10px] font-mono tracking-widest uppercase bg-accent/80 px-2 py-0.5 rounded">CAMPUS LIFE</span>
                  <h3 className="text-xl font-bold">Disciplined & Energetic Student Community</h3>
                </div>
              </div>

              {/* Stacked Side Photos */}
              <div className="md:col-span-5 grid grid-rows-2 gap-6">
                <div className="relative overflow-hidden rounded-2xl shadow-md group h-[178px]">
                  <img
                    src="/786159099_1382471063266617_3694329204075790563_n.jpg"
                    alt="Sports"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-sm font-bold">Annual Sports & Physical Gala</h4>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl shadow-md group h-[178px]">
                  <img
                    src="/764832869_1300983421935137_9109381775934082513_n.jpg"
                    alt="Culture"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h4 className="text-sm font-bold">Cultural Programs & Wall Magazines</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. ACHIEVEMENTS & ACTIVITIES (Editorial Layout, Real DB Data Only) */}
        <section className="py-20 bg-slate-50 border-y border-slate-200">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-mono tracking-widest uppercase text-accent font-bold">ACHIEVEMENTS</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-serif">
                Celebrating Student Excellence
              </h2>
            </div>

            {(!news || news.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-500 font-light border border-dashed border-slate-300 rounded-xl">
                No achievements published yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {news.slice(0, 2).map((item: any) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-6 items-start bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    {item.coverImage && (
                      <img
                        src={item.coverImage}
                        alt={item.title}
                        className="w-full sm:w-36 h-36 rounded-xl object-cover shrink-0"
                      />
                    )}
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{item.title}</h3>
                      <p className="text-xs text-slate-600 font-light line-clamp-2 leading-relaxed">{item.summary}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 10. NOTICE + NEWS (Left Minimal List, Right Featured Story + Sub-items) */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
              {/* Left Minimal Notice List */}
              <div className="lg:col-span-5 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">Official Notices</h3>
                  <Link href="/notices" className="text-xs font-mono font-bold text-primary hover:underline">
                    View All →
                  </Link>
                </div>

                {(!notices || notices.length === 0) ? (
                  <p className="text-xs text-slate-500 font-light py-8 italic">No notices currently published.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notices.slice(0, 5).map((notice: any) => (
                      <Link
                        key={notice.id}
                        href="/notices"
                        className="py-4 block group hover:pl-1 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {new Date(notice.createdAt || Date.now()).toLocaleDateString('bn-BD')}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2">
                              {notice.title}
                            </h4>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary shrink-0 mt-1" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Featured News Story + 2 Sub-items */}
              <div className="lg:col-span-7 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-serif">Campus News & Coverage</h3>
                  <Link href="/news" className="text-xs font-mono font-bold text-primary hover:underline">
                    All News →
                  </Link>
                </div>

                {(!news || news.length === 0) ? (
                  <p className="text-xs text-slate-500 font-light py-8 italic">No news published yet.</p>
                ) : (
                  <div className="space-y-8">
                    {/* Featured Top News Story */}
                    {news[0] && (
                      <div className="space-y-4 group">
                        {news[0].coverImage && (
                          <div className="overflow-hidden rounded-2xl shadow-lg h-64">
                            <img
                              src={news[0].coverImage}
                              alt={news[0].title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        )}
                        <div className="space-y-2">
                          <span className="text-xs font-mono text-slate-400">
                            {new Date(news[0].createdAt || Date.now()).toLocaleDateString()}
                          </span>
                          <h4 className="text-xl font-bold text-slate-900 group-hover:text-primary transition-colors">
                            {news[0].title}
                          </h4>
                          <p className="text-xs text-slate-600 font-light leading-relaxed">
                            {news[0].summary}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Sub-items */}
                    {news.slice(1, 3).map((sub: any) => (
                      <div key={sub.id} className="pt-4 border-t border-slate-100 flex items-start gap-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(sub.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                          <h5 className="text-sm font-bold text-slate-900 line-clamp-1">{sub.title}</h5>
                          <p className="text-xs text-slate-600 font-light line-clamp-1">{sub.summary}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 11. UPCOMING EVENTS (Clean Vertical Timeline) */}
        <section className="py-24 bg-slate-900 text-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-widest text-accent uppercase font-bold">WHAT'S HAPPENING</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-serif">
                  Upcoming Events Timeline
                </h2>
              </div>
              <Link href="/events" className="text-xs font-mono font-bold text-slate-300 hover:text-white uppercase tracking-wider">
                Full Calendar →
              </Link>
            </div>

            {(!events || events.length === 0) ? (
              <p className="text-xs text-slate-400 font-light italic py-8 border-t border-slate-800">
                No upcoming events at the moment.
              </p>
            ) : (
              <div className="divide-y divide-slate-800 border-t border-b border-slate-800">
                {events.slice(0, 4).map((ev: any) => (
                  <div key={ev.id} className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                      <div className="text-center bg-slate-800 px-4 py-2 rounded-xl min-w-[70px] shrink-0 border border-slate-700">
                        <span className="text-lg font-extrabold font-mono text-accent block">
                          {new Date(ev.startDate || Date.now()).getDate()}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block">
                          {new Date(ev.startDate || Date.now()).toLocaleDateString('en-GB', { month: 'short' })}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-white">{ev.title}</h4>
                        <p className="text-xs text-slate-400 font-light">{ev.venue} • {ev.description || 'Academic Program'}</p>
                      </div>
                    </div>
                    <Link href="/events">
                      <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors">
                        View Event
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 12. RESULTS (Visual Search Section with Side Image) */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              {/* Left Search Box */}
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono tracking-widest text-accent uppercase font-bold">ACADEMIC RESULTS</span>
                  <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 font-serif">
                    CHECK YOUR RESULTS
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 font-light">
                    Enter student credentials to search and inspect term examination marksheets.
                  </p>
                </div>

                <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Roll Number / Admission ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1001"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
                      Registration Number (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. REG-2026-042"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                    />
                  </div>

                  <Link href="/results" className="block pt-2">
                    <Button className="w-full py-6 font-bold text-sm bg-primary hover:bg-primary/90 text-white shadow-md gap-2">
                      <Search className="h-4 w-4" />
                      <span>View Result Transcript</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Side Visual Image */}
              <div className="lg:col-span-6">
                <div className="overflow-hidden rounded-2xl shadow-xl">
                  <img
                    src="/786656880_1616644293215292_2836054805930890432_n.jpg"
                    alt="Results Search"
                    className="w-full h-[450px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 13. PORTAL (Full-Width Visual ERP Showcase, Horizontal Links) */}
        <section className="py-24 bg-slate-950 text-white border-y border-slate-800">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-12">
            <div className="max-w-2xl space-y-3">
              <span className="text-xs font-mono tracking-widest text-accent uppercase font-bold">DIGITAL ERP SYSTEM</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
                YOUR SCHOOL, CONNECTED.
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-light">
                Integrated portal access for learners, guardians, and academic staff.
              </p>
            </div>

            {/* 3 Elegant Horizontal Rows */}
            <div className="divide-y divide-slate-800 border-t border-b border-slate-800">
              <Link href="/login" className="py-8 block group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-mono text-slate-500">01</span>
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-accent transition-colors">Students Portal</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Attendance logs, class routines, fee statements & report cards.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-white inline-flex items-center gap-2">
                    <span>Student Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>

              <Link href="/login" className="py-8 block group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-mono text-slate-500">02</span>
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-accent transition-colors">Parents Portal</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Track ward attendance, academic progress, pay fees & notices.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-white inline-flex items-center gap-2">
                    <span>Parent Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>

              <Link href="/login" className="py-8 block group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-mono text-slate-500">03</span>
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-accent transition-colors">Teachers Portal</h4>
                      <p className="text-xs text-slate-400 font-light mt-0.5">Mark attendance, record examination marks & timetable management.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 group-hover:text-white inline-flex items-center gap-2">
                    <span>Teacher Login</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* 14. ADMISSION CTA (Full-Width Cinematic Banner) */}
        <section className="relative py-28 bg-slate-900 text-white overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25 scale-105"
            style={{ backgroundImage: `url('/787124177_2051232472934207_3472095284671851725_n.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950" />

          <div className="relative mx-auto max-w-4xl px-6 text-center space-y-6">
            <span className="text-xs font-mono tracking-widest text-accent uppercase font-bold">ADMISSIONS OPEN</span>
            <h2 className="text-3xl sm:text-6xl font-extrabold tracking-tight text-white font-serif">
              READY TO BEGIN THE JOURNEY?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-light leading-relaxed">
              Enrollment applications for the current session are now open online through our official portal.
            </p>
            <div className="pt-4">
              <Link href="/admissions">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-10 py-6 rounded-none shadow-2xl tracking-wide">
                  Apply for Admission →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 15. CONTACT / CAMPUS */}
        <section className="py-24 sm:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              {/* Left Information */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-2">
                  <span className="text-xs font-mono tracking-widest text-accent uppercase font-bold">VISIT US</span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-serif">
                    Visit Our Campus
                  </h2>
                </div>

                <div className="space-y-4 text-xs text-slate-600 font-light">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 font-bold block">Address:</strong>
                      <span>Pirgachha, Rangpur, Bangladesh (Estd. 2010)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 font-bold block">Phone:</strong>
                      <span>+880 1711-234567 / +880 1819-876543</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 font-bold block">Email:</strong>
                      <span>info@nobleschool.edu.bd</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 font-bold block">Office Hours:</strong>
                      <span>Monday - Saturday: 8:00 AM - 4:30 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Clean Google Map Embed */}
              <div className="lg:col-span-7 rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-72">
                <iframe
                  title="Noble Residential High School Google Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3596.538183248135!2d89.4000!3d25.7000!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed000000000000%3A0x0!2sPirgachha%2C%20Rangpur!5e0!3m2!1sen!2sbd!4v1680000000000!5m2!1sen!2sbd"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 16. FOOTER */}
      <PublicFooter />
    </div>
  );
}
