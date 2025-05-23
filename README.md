# CCI Calculator for SEBI CSCRF Compliance

A Next.js application to calculate the Cyber Capability Index (CCI) for cybersecurity assessment in alignment with the Securities and Exchange Board of India (SEBI) Cyber Security and Cyber Resilience Framework (CSCRF).

## About CCI

The Cyber Capability Index (CCI) is an index-framework to rate the preparedness and resilience of the cybersecurity framework of Market Infrastructure Institutions (MIIs) and Qualified Regulated Entities (REs) in accordance with SEBI's guidelines. This calculator helps organizations assess their cybersecurity maturity level based on 23 parameters with different weightages that align with SEBI CSCRF requirements.

## SEBI CSCRF Overview

The SEBI CSCRF ([SEBI Circular](https://www.sebi.gov.in/legal/circulars/aug-2024/cybersecurity-and-cyber-resilience-framework-cscrf-for-sebi-regulated-entities-res-_85964.html)) establishes cybersecurity requirements for Indian financial market participants. It covers key areas including:

- **Governance and Organizational Structure**: Board-approved cybersecurity policy, designated CISO role, and clear reporting structures
- **Risk Assessment and Management**: Comprehensive asset inventory, regular risk assessments, and vendor risk management
- **Access Controls and Cyber Resilience**: Multi-factor authentication, least privilege principles, and data protection measures
- **Security Operations and Monitoring**: SIEM implementation, 24x7 monitoring capabilities, and vulnerability management
- **Incident Response and Recovery**: Documented incident response plans, regular testing exercises, and recovery procedures
- **Regular Audits and Compliance Reporting**: Bi-annual audits by CERT-In empanelled organizations and quarterly vulnerability assessments

The CCI calculator helps entities measure their compliance with these requirements through quantifiable metrics.

## Key CCI Parameters

The CCI framework evaluates cybersecurity maturity across 23 parameters organized into the following categories:

### Governance (GV)
- **GV.PO.S1**: Policy Document (5% weightage)
- **GV.RR.S4**: Security Budget (8% weightage)
- **GV.SC.S3**: Third-Party Management (4% weightage)

### Identify (ID)
- **ID.AM.S1/S2**: Critical Assets Identification (9% weightage)
- **ID.RA.S2**: Risk Assessment (8% weightage)

### Protect (PR)
- **PR.AA.S7**: User Account Management (5% weightage)
- **PR.AA.S12**: Remote Access Security (4% weightage)
- **PR.AT.S1**: Security Training (6% weightage)
- **PR.DS.S3**: Data Protection (7% weightage)

### Detect (DE)
- **DE.CM.S1**: Audit Records (5% weightage)
- **DE.CM.S5**: Vulnerability Management (18% weightage)

### Respond (RS)
- **RS.CO.S2**: Incident Reporting (6% weightage)
- **RS.MA.S3**: Contingency Testing (5% weightage)

### Recover (RC)
- **RC.RP.S1**: Recovery Planning (5% weightage)
- **RC.IM.S1**: Recovery Improvements (5% weightage)

## Features

- Input numerator and denominator values for 23 cybersecurity parameters
- Automatic calculation of self-assessment scores
- Weighted calculation of the overall CCI score
- Determination of the cybersecurity maturity level in line with SEBI expectations
- Comprehensive reporting to assist with bi-annual compliance audits
- Responsive design that works on all devices

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/cci-calculator.git
   cd cci-calculator
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Usage

1. Enter the numerator and denominator values for each parameter according to the formulas provided.
2. Click the "Calculate CCI" button to see your organization's CCI score and maturity level.
3. Review detailed parameter-specific insights and improvement recommendations.
4. Use the generated reports for internal assessments and regulatory submissions.
5. Use the "Reset All Values" button to clear all inputs and start over.

## Maturity Levels

- **Exceptional Cybersecurity Maturity**: 91-100 - Exceeds SEBI requirements with advanced capabilities
- **Optimal Cybersecurity Maturity**: 81-90 - Fully compliant with robust implementation
- **Manageable Cybersecurity Maturity**: 71-80 - Generally compliant with some areas for improvement
- **Developing Cybersecurity Maturity**: 61-70 - Partially compliant with significant gaps
- **Bare Minimum Cybersecurity Maturity**: 51-60 - Minimal compliance with critical gaps
- **Fail**: 50.99 or below - Non-compliant, requires immediate remediation


## Compliance Benefits

This tool helps organizations:
- Prepare for CERT-In empanelled auditor assessments
- Document cybersecurity capabilities for SEBI reporting
- Identify improvement areas to enhance cyber resilience
- Track progress over time against regulatory expectations
- Meet the June 30, 2025 compliance deadline for Qualified REs and MIIs


## License

[MIT](LICENSE) 
