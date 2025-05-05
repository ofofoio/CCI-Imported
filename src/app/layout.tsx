import React from 'react';
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SEBI CSCRF CCI Calculator | Cyber Capability Index Tool for Qualified REs & MIIs',
  description: 'Official SEBI CSCRF Compliance Assessment Tool for the Cyber Capability Index (CCI). Used by Qualified REs and MIIs to meet June 30, 2025 compliance deadline.',
  keywords: 'SEBI, CSCRF, Cyber Capability Index, CCI Calculator, Qualified REs, MIIs, Cybersecurity Compliance, SEBI Circular, June 2025 deadline',
  authors: [{ name: 'SEBI CSCRF Implementation Team' }],
  category: 'Cybersecurity Compliance',
  openGraph: {
    title: 'SEBI CSCRF CCI Calculator | Official Compliance Tool',
    description: 'Cyber Capability Index calculator for SEBI CSCRF compliance requirements for Qualified REs and MIIs. Calculate your compliance score before the June 30, 2025 deadline.',
    url: 'https://cci-calculator.io',
    siteName: 'SEBI CSCRF CCI Calculator',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEBI CSCRF CCI Calculator',
    description: 'Official compliance assessment tool for SEBI CSCRF requirements',
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