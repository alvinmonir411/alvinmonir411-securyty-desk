import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nobleschool.edu.bd';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/teacher/', '/student/', '/parent/', '/accountant/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
