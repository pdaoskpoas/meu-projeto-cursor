import React from 'react';
import { Helmet } from 'react-helmet-async';

interface ArticleSEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
  category?: string;
  tags?: string[];
}

const ArticleSEO: React.FC<ArticleSEOProps> = ({
  title,
  description,
  image,
  url,
  author,
  publishedAt,
  category,
  tags = []
}) => {
  const siteUrl = window.location.origin;
  const fullUrl = url || window.location.href;
  const fullImageUrl = image?.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Básico */}
      <title>{title} | Cavalaria Digital</title>
      <meta name="description" content={description || title} />
      
      {/* Open Graph (Facebook, LinkedIn) */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description || title} />
      {image && <meta property="og:image" content={fullImageUrl} />}
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="Cavalaria Digital" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description || title} />
      {image && <meta name="twitter:image" content={fullImageUrl} />}
      
      {/* Article específico */}
      {publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {author && (
        <meta property="article:author" content={author} />
      )}
      {category && (
        <meta property="article:section" content={category} />
      )}
      {tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          "headline": title,
          "description": description || title,
          "image": image ? fullImageUrl : undefined,
          "datePublished": publishedAt,
          "author": {
            "@type": "Person",
            "name": author || "Cavalaria Digital"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Cavalaria Digital",
            "logo": {
              "@type": "ImageObject",
              "url": `${siteUrl}/logo.png.png`
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": fullUrl
          },
          "articleSection": category,
          "keywords": tags.join(', ')
        })}
      </script>
    </Helmet>
  );
};

export default ArticleSEO;



