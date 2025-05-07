import React from 'react';
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SEBI CSCRF CCI Calculator | Cyber Capability Index Tool for Qualified REs & MIIs',
  description: 'Official SEBI CSCRF Compliance Assessment Tool for the Cyber Capability Index (CCI). Helps Qualified REs and MIIs meet SEBI\'s cybersecurity requirements by the June 30, 2025 compliance deadline with 23 weighted parameters.',
  keywords: 'SEBI, CSCRF, Cyber Capability Index, CCI Calculator, Qualified REs, MIIs, Cybersecurity Compliance, SEBI Circular, June 2025 deadline, Vulnerability Assessment, Risk Management, Security Budget, Critical Assets, CERT-In, Cyber Resilience, Information Security, Financial Market Infrastructure, Regulatory Compliance, Cybersecurity Maturity',
  authors: [{ name: 'SEBI CSCRF Implementation Team' }],
  category: 'Cybersecurity Compliance',
  openGraph: {
    title: 'SEBI CSCRF CCI Calculator | Official Compliance Tool',
    description: 'Cyber Capability Index calculator for SEBI CSCRF compliance requirements. Assess your cybersecurity maturity across 23 parameters with different weightages to meet the June 30, 2025 deadline for Qualified REs and MIIs.',
    url: 'https://cci-calculator.io',
    siteName: 'SEBI CSCRF CCI Calculator',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: 'https://cci-calculator.io/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SEBI CSCRF CCI Calculator'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEBI CSCRF CCI Calculator',
    description: 'Official compliance assessment tool for SEBI CSCRF requirements. Calculate your Cyber Capability Index score across governance, risk management, technical controls, and incident response.',
    images: ['https://cci-calculator.io/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-IN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://cci-calculator.io" />
        <meta name="application-name" content="SEBI CSCRF CCI Calculator" />
        <meta property="og:locale" content="en_IN" />
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        <meta name="description" content="Calculate your Cyber Capability Index (CCI) score for SEBI CSCRF compliance. Assess cybersecurity maturity across 23 parameters including vulnerability management, risk assessment, and security operations." />
        <meta name="keywords" content="SEBI CSCRF, Cyber Security Framework, Cyber Resilience Framework, CCI Calculator, Cybersecurity Assessment, Vulnerability Management, Qualified REs, MIIs, Bi-Annual Audit, CERT-In, Cybersecurity Maturity, Financial Market Infrastructure" />
        
        {/* Structured Data for SEO */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "SEBI CSCRF CCI Calculator",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            },
            "description": "Official tool for calculating Cyber Capability Index (CCI) scores in compliance with SEBI CSCRF requirements. Helps financial market participants assess their cybersecurity maturity across 23 parameters.",
            "provider": {
              "@type": "Organization",
              "name": "SEBI CSCRF Implementation Team"
            }
          })
        }} />
        
        {/* Google Analytics Tag */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-K80K2XLT6C"></script>
        <script 
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-K80K2XLT6C');
            `
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
} 