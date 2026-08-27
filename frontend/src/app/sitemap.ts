import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nobleschool.edu.bd';

  const routes = [
    '',
    '/about',
    '/academics',
    '/routine',
    '/syllabus',
    '/booklist',
    '/results',
    '/notices',
    '/news',
    '/events',
    '/admissions',
    '/teachers',
    '/gallery',
    '/extracurricular',
    '/alumni',
    '/contact',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : route === '/admissions' ? 0.9 : 0.8,
  }));
}
