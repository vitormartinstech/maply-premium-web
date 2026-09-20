import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://maply-premium-web.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    // Se no futuro criar uma página de termos de uso, por exemplo, adicionaria assim:
    // {
    //   url: 'https://maply-premium-web.vercel.app/termos',
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly',
    //   priority: 0.5,
    // },
  ]
}