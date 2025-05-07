import React from 'react';
import Head from 'next/head';
import schema from '../app/seo-schema.json';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
}

export default function SEO({
  title = 'SEBI CSCRF CCI Calculator | Cyber Capability Index Tool for Qualified REs & MIIs',
  description = 'Official SEBI CSCRF Compliance Assessment Tool for the Cyber Capability Index (CCI). Helps Qualified REs and MIIs meet SEBI\'s cybersecurity requirements by the June 30, 2025 compliance deadline with 23 weighted parameters.',
  keywords = 'SEBI, CSCRF, Cyber Capability Index, CCI Calculator, Qualified REs, MIIs, Cybersecurity Compliance, SEBI Circular, June 2025 deadline, Vulnerability Assessment, Risk Management',
  ogImage = 'https://cci-calculator.io/og-image.png',
  ogUrl = 'https://cci-calculator.io',
  canonical = 'https://cci-calculator.io',
}: SEOProps) {
  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Canonical Link */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:site_name" content="SEBI CSCRF CCI Calculator" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={ogUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Geo Tags */}
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      
      {/* Additional Tags */}
      <meta name="application-name" content="SEBI CSCRF CCI Calculator" />
      <meta name="apple-mobile-web-app-title" content="SEBI CSCRF CCI Calculator" />
      <meta name="author" content="SEBI CSCRF Implementation Team" />
      
      {/* Schema.org JSON-LD */}
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      
      {/* SEBI CSCRF Specific Tags */}
      <meta name="sebi-cscrf-compliance" content="CCI Calculator" />
      <meta name="sebi-cscrf-version" content="2023" />
      <meta name="sebi-cscrf-parameters" content="23" />
      <meta name="sebi-cscrf-deadline" content="June 30, 2025" />
    </Head>
  );
} 