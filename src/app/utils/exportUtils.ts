import { saveAs } from 'file-saver';
import { CCIResult, CCIParameter, AnnexureKData } from '../types';
import toast from 'react-hot-toast';
import { calculateParameterScore, calculateWeightedScore } from './cciCalculator';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Convert table data to markdown-style text format
 * 
 * @param headers Array of column headers
 * @param rows Array of row data (each row is an array of cells)
 * @returns Formatted text representation of the table
 */
const convertTableToMarkdown = (headers: string[], rows: any[][]): string => {
  let result = '';
  
  // Add headers
  if (headers && headers.length > 0) {
    result += headers.join(' | ') + '\n';
    result += headers.map(() => '---').join(' | ') + '\n';
  }
  
  // Add rows
  if (rows && rows.length > 0) {
    rows.forEach(row => {
      result += row.join(' | ') + '\n';
    });
  }
  
  return result;
};

/**
 * Sanitizes a string to be safely used in filenames by:
 * - Removing invalid filename characters
 * - Replacing spaces with underscores
 * - Trimming excess whitespace
 * @param input The string to sanitize
 * @returns A filesystem-safe string
 */
const sanitizeFilename = (input: string): string => {
  if (!input) return 'Unnamed';
  
  // Remove invalid filename characters and replace spaces with underscores
  return input
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid filename characters with hyphens
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/__+/g, '_')           // Replace multiple underscores with single one
    .substring(0, 100);             // Limit length to avoid excessive filenames
};

// Add function to handle maturity level display properly
const getFormattedMaturityLevel = (score: number, maturityLevel: string): string => {
  // Special handling for 'Fail' level
  if (maturityLevel === 'Fail') {
    return 'Fail';
  }
  
  // Handle normal maturity levels 
  if (score >= 91) return 'Exceptional';
  if (score >= 81) return 'Optimal';
  if (score >= 71) return 'Manageable';
  if (score >= 61) return 'Developing';
  if (score >= 51) return 'Bare Minimum';
  return 'Insufficient';
};

/**
 * Generate and export SEBI CSCRF report in Markdown format
 * 
 * @param parameters The complete set of CCIParameters with values
 * @param result The calculated CCIResult with scores
 * @param annexureKData Optional Annexure K form data
 */
export const exportToMarkdown = (
  parameters: CCIParameter[],
  result: CCIResult,
  annexureKData?: AnnexureKData
) => {
  try {
    // Display loading indicator
    toast('Generating Markdown document...', { 
      id: 'markdown-export',
      duration: 5000
    });

    // Initialize markdown content
    let markdown = '';
    
    // Add title and header
    markdown += `# SEBI CSCRF Compliance Report\n\n`;
    markdown += `## Organization: ${result.organization}\n`;
    markdown += `Assessment Date: ${new Date(result.date).toLocaleDateString('en-GB')}\n\n`;
    
    // Add Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `| Metric | Value |\n`;
    markdown += `| ------ | ----- |\n`;
    markdown += `| **Overall CCI Score** | ${result.totalScore.toFixed(2)}/100 |\n`;
    markdown += `| **Maturity Level** | ${result.maturityLevel} |\n`;
    markdown += `| **Compliance Status** | ${result.totalScore >= 60 ? '✅ Compliant' : '❌ Non-Compliant'} |\n\n`;
    
    markdown += `### Maturity Description\n\n`;
    markdown += `${result.maturityDescription}\n\n`;
    
    // Add Annexure K - SEBI format
    markdown += `## Annexure-K: Cyber Capability Index (CCI)\n\n`;
    markdown += `**REPORTING FORMAT FOR MIIs AND QUALIFIED REs TO SUBMIT THEIR CCI SCORE**\n\n`;
    markdown += `**NAME OF THE ORGANISATION:** ${result.organization}\n\n`;
    markdown += `**ENTITY TYPE:** ${annexureKData?.entityType || '<Intermediary Type>'}\n\n`;
    markdown += `**ENTITY CATEGORY:** ${annexureKData?.entityCategory || '<Category of the RE as per CSCRF>'}\n\n`;
    markdown += `**RATIONALE FOR THE CATEGORY:** ${annexureKData?.rationale || '<Rationale>'}\n\n`;
    markdown += `**PERIOD:** ${annexureKData?.period || '<Assessment Period>'}\n\n`;
    
    if (annexureKData?.auditingOrganization) {
      markdown += `**NAME OF THE AUDITING ORGANISATION (applicable for MIIs):** ${annexureKData.auditingOrganization}\n\n`;
    } else {
      markdown += `**NAME OF THE AUDITING ORGANISATION (applicable for MIIs):** <Name>\n\n`;
    }
    
    markdown += `**RE's Authorised signatory declaration:**\n\n`;
    markdown += `I/ We hereby confirm that Cyber Capability Index (CCI) has been verified by me/ us and I/ We shall take the responsibility and ownership of the CCI report.\n\n`;
    markdown += `**Signature:** _______________________\n\n`;
    markdown += `**Name of the signatory:** ${annexureKData?.signatoryName || '<Name>'}\n\n`;
    markdown += `**Designation (choose whichever applicable):** ${annexureKData?.designation || '<MD/ CEO/ Board member/ Partners/ Proprietor>'}\n\n`;
    markdown += `**Company stamp:** _______________________\n\n`;
    
    markdown += `### Annexures:\n`;
    markdown += `1. CCI report as per the format given in Table 27 and CCI score\n\n`;
    
    markdown += `### Cyber Capability Index (CCI)\n\n`;
    markdown += `**A. Background-**\n\n`;
    markdown += `CCI is an index-framework to rate the preparedness and resilience of the cybersecurity framework of the Market Infrastructure Institutions (MIIs) and Qualified REs. While MIIs are required to conduct third-party assessment of their cyber resilience on a half-yearly basis, Qualified REs are directed to conduct self-assessment of their cyber resilience on an annual basis.\n\n`;
    
    markdown += `**B. Index Calculation Methodology-**\n\n`;
    markdown += `1. The index is calculated on the basis of 23 parameters. These parameters have been given different weightages.\n`;
    markdown += `2. Implementation evidence to be submitted to SEBI only on demand.\n`;
    markdown += `3. All implementation evidences shall be verified by the auditor for conducting third-party assessment of MIIs.\n`;
    markdown += `4. The list of CCI parameters, their corresponding target and weightages in the index, is as follows:\n\n`;
  
  // Group parameters by framework category
  const paramsByCategory: Record<string, CCIParameter[]> = {};
  parameters.forEach(param => {
    const category = param.frameworkCategory || 'Uncategorized';
    if (!paramsByCategory[category]) {
      paramsByCategory[category] = [];
    }
    paramsByCategory[category].push(param);
  });
  
    // Define the standard NIST CSF categories and their display order
    const categoryOrder = [
      'Governance',
      'Identify',
      'Protect',
      'Detect',
      'Respond',
      'Recover',
      'Uncategorized'
    ];
    
    // Calculate and organize category scores
  const categoryScores = Object.keys(paramsByCategory).map(category => {
    const params = paramsByCategory[category];
      const totalWeightage = params.reduce((sum, param) => sum + param.weightage, 0);
      const weightedSum = params.reduce((sum, param) => sum + calculateWeightedScore(param), 0);
    const categoryScore = totalWeightage > 0 ? (weightedSum / totalWeightage) * 100 : 0;
      
      // Get main category (extract first part before colon)
      const mainCategory = category.split(':')[0]?.trim() || category;
      
      // Get maturity level
      let maturityLevel = "Insufficient";
      if (categoryScore >= 91) maturityLevel = "Exceptional";
      else if (categoryScore >= 81) maturityLevel = "Optimal";
      else if (categoryScore >= 71) maturityLevel = "Manageable";
      else if (categoryScore >= 61) maturityLevel = "Developing";
      else if (categoryScore >= 51) maturityLevel = "Bare Minimum";
    
    return {
      category,
        mainCategory,
        score: categoryScore,
        maturityLevel,
        totalWeightage,
        weightedScore: weightedSum
    };
  });
  
    // Sort categories according to the predefined order
    const sortedCategoryScores = categoryScores.sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.category);
      const indexB = categoryOrder.indexOf(b.category);
      
      // If category not found in the order list, put it at the end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
    
    // Calculate main category (Governance, Identify, etc.) aggregated scores
    const mainCategoryScores: Record<string, { score: number, maturityLevel: string, totalWeightage: number }> = {};
    const mainCategoryWeightedScores: Record<string, number> = {};
    const mainCategoryTotalWeightage: Record<string, number> = {};
    
    // Aggregate scores by main category
    categoryScores.forEach(cat => {
      if (!mainCategoryWeightedScores[cat.mainCategory]) {
        mainCategoryWeightedScores[cat.mainCategory] = 0;
        mainCategoryTotalWeightage[cat.mainCategory] = 0;
      }
      
      mainCategoryWeightedScores[cat.mainCategory] += cat.weightedScore;
      mainCategoryTotalWeightage[cat.mainCategory] += cat.totalWeightage;
    });
    
    // Calculate final scores and maturity levels for main categories
    Object.keys(mainCategoryWeightedScores).forEach(main => {
      const totalWeightage = mainCategoryTotalWeightage[main];
      const weightedScore = mainCategoryWeightedScores[main];
      const score = totalWeightage > 0 ? (weightedScore / totalWeightage) * 100 : 0;
      
      // Get maturity level
      let maturityLevel = "Insufficient";
      if (score >= 91) maturityLevel = "Exceptional";
      else if (score >= 81) maturityLevel = "Optimal";
      else if (score >= 71) maturityLevel = "Manageable";
      else if (score >= 61) maturityLevel = "Developing";
      else if (score >= 51) maturityLevel = "Bare Minimum";
      
      mainCategoryScores[main] = {
        score,
        maturityLevel,
        totalWeightage
      };
    });
    
    // Main category order - only show the 6 specified categories
    const mainCategoryOrder = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
    
    // CCI Table (Table 27 format)
    markdown += `### Table 27: CCI parameters with corresponding measure, implementation evidence, target, and weightage\n\n`;
    markdown += `| S No | Measure ID | Goal/Objective | Measure | Measure Type | Formula | Target | Implementation Evidence | Weightage | Self-assessment score | Auditor comments w.r.t. cyber audit (for MIIs) |\n`;
    markdown += `| ---- | ---------- | -------------- | ------- | ------------ | ------- | ------ | ----------------------- | --------- | --------------------- | -------------------------------------------- |\n`;
    
    // Add parameters in Table 27 format
    parameters.forEach((param, index) => {
      const score = calculateParameterScore(param);
      const formattedScore = score.toFixed(1);
      
      markdown += `| ${index + 1} | ${param.measureId} | ${param.description || 'N/A'} | ${param.title} | ${'Effectiveness'} | ${param.formula || 'N/A'} | ${param.target || '100%'} | ${param.implementationEvidence || 'N/A'} | ${param.weightage}% | ${formattedScore} | ${param.auditorComments || ''} |\n`;
    });
    
    markdown += `\n### Based on the value of the index, the cybersecurity maturity level is determined as follows:\n\n`;
    markdown += `| SN. | Rating | Index Score Rating |\n`;
    markdown += `| --- | ------ | ----------------- |\n`;
    markdown += `| 1 | Exceptional Cybersecurity Maturity | 100-91 |\n`;
    markdown += `| 2 | Optimal Cybersecurity Maturity | 90-81 |\n`;
    markdown += `| 3 | Manageable Cybersecurity Maturity | 80-71 |\n`;
    markdown += `| 4 | Developing Cybersecurity Maturity | 70-61 |\n`;
    markdown += `| 5 | Bare Minimum Cybersecurity Maturity | 60-51 |\n`;
    markdown += `| 6 | Fail | <=50 |\n\n`;
    
    markdown += `**Note:** The RE has scored below the cut-off in at least one domain/sub-domain if marked as Fail.\n\n`;
    markdown += `MIIs and Qualified REs shall strive for building an automated tool and suitable dashboards (preferably integrated with log aggregator) for submitting compliance. A dashboard shall be available at the time of cyber audit, onsite inspection/audit by SEBI or any agency appointed by SEBI.\n\n`;
    
    // Add Category Analysis
    markdown += `## Category Analysis\n\n`;
    
    // Create category table
    markdown += `| Category | Score | Maturity Level | Compliance Status | Priority |\n`;
    markdown += `| -------- | ----- | -------------- | ----------------- | -------- |\n`;
    
    // Add main categories in the specified order with emoji indicators
    mainCategoryOrder.forEach(main => {
      if (mainCategoryScores[main]) {
        const score = mainCategoryScores[main].score;
        const maturityLevel = mainCategoryScores[main].maturityLevel;
        const complianceStatus = score >= 60 ? '✅ Compliant' : '❌ Non-Compliant';
        const priority = score >= 60 ? 'Low' : 'High';
        markdown += `| ${main} | ${score.toFixed(1)} | ${maturityLevel} | ${complianceStatus} | ${priority} |\n`;
      }
    });
    
    // Add Category Maturity Classification section
    markdown += `\n## Category Maturity Classification\n`;
    markdown += `Detailed breakdown of maturity levels by security domain\n\n`;
    
    // Add each main category with its score and weightage in card-like format
    mainCategoryOrder.forEach(main => {
      if (mainCategoryScores[main]) {
        const score = mainCategoryScores[main].score;
        const maturityLevel = mainCategoryScores[main].maturityLevel;
        const weightage = mainCategoryScores[main].totalWeightage;
        
        markdown += `### ${main}\n\n`;
        markdown += `**Score:** ${score.toFixed(1)}\n\n`;
        markdown += `**Weightage:** ${weightage}%\n\n`;
        markdown += `**Maturity Level:** ${maturityLevel}\n\n`;
        
        // Add emoji indicators based on score
        if (score >= 80) {
          markdown += `**Status:** 🟢 Strong controls\n\n`;
        } else if (score >= 60) {
          markdown += `**Status:** 🟡 Adequate controls\n\n`;
        } else {
          markdown += `**Status:** 🔴 Needs improvement\n\n`;
        }
        
        markdown += `---\n\n`;
      }
    });
    
    // Add Detailed Parameters by Category
    markdown += `## Detailed Parameter Assessments\n\n`;
    
    // Add parameter details by category
    sortedCategoryScores.forEach(categoryScore => {
      const category = categoryScore.category;
      markdown += `### ${category}\n\n`;
      markdown += `**Category Score:** ${categoryScore.score.toFixed(1)} - ${categoryScore.maturityLevel}\n\n`;
      
      // Parameter table
      markdown += `| Parameter | Numerator | Denominator | Weightage | Score | Weighted Score |\n`;
      markdown += `| --------- | :-------: | :---------: | :-------: | :---: | :-----------: |\n`;
      
    paramsByCategory[category].forEach(param => {
      const score = calculateParameterScore(param);
      const weightedScore = calculateWeightedScore(param);
      
        markdown += `| **${param.title}** (${param.measureId}) | ${param.numerator} | ${param.denominator} | ${param.weightage}% | ${score.toFixed(2)} | ${weightedScore.toFixed(2)} |\n`;
      });
      
      markdown += `\n`;
      
      // Add parameter details with better separation
      paramsByCategory[category].forEach(param => {
        const score = calculateParameterScore(param);
        
        markdown += `#### ${param.title} (${param.measureId})\n\n`;
        
        // Add scoring information
        markdown += `| Metric | Value |\n`;
        markdown += `| ------ | ----- |\n`;
        markdown += `| Score | ${score.toFixed(2)} |\n`;
        markdown += `| Numerator | ${param.numerator} |\n`;
        markdown += `| Denominator | ${param.denominator} |\n`;
        markdown += `| Weightage | ${param.weightage}% |\n\n`;
        
        markdown += `**Description:**\n\n${param.description || 'No description provided.'}\n\n`;
        markdown += `**Control Information:**\n\n${param.controlInfo || 'No control information provided.'}\n\n`;
        markdown += `**Implementation Evidence:**\n\n${param.implementationEvidence || 'No implementation evidence provided.'}\n\n`;
        
        if (param.standardContext) {
          markdown += `**Standard Context:**\n\n${param.standardContext}\n\n`;
        }
        
        if (param.bestPractices) {
          markdown += `**Best Practices:**\n\n${param.bestPractices}\n\n`;
        }
        
        if (param.regulatoryGuidelines) {
          markdown += `**Regulatory Guidelines:**\n\n${param.regulatoryGuidelines}\n\n`;
        }
        
        if (param.auditorComments) {
          markdown += `**Auditor Comments:**\n\n${param.auditorComments}\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    });
    
    // Add notes and observations
    markdown += `## Notes & Observations\n\n`;
    markdown += `This report provides a snapshot of the organization's cyber capability maturity based on the assessment date shown above.\n\n`;
    markdown += `The CCI is calculated based on the 23 parameters across various domains as specified in the SEBI CSCRF guidelines.\n\n`;
    markdown += `For areas with lower scores, consider developing action plans to enhance controls and improve overall cyber resilience.\n\n`;
    
    markdown += `### Maturity Level Classification\n\n`;
    markdown += `| Level | Score Range | Description |\n`;
    markdown += `| ----- | ----------- | ----------- |\n`;
    markdown += `| **Exceptional** | 91-100 | Leading-edge security posture with advanced capabilities |\n`;
    markdown += `| **Optimal** | 81-90 | Robust security program with well-integrated controls |\n`;
    markdown += `| **Manageable** | 71-80 | Established security program with consistent implementation |\n`;
    markdown += `| **Developing** | 61-70 | Basic security controls with some gaps in implementation |\n`;
    markdown += `| **Bare Minimum** | 51-60 | Minimal security controls meeting basic requirements |\n`;
    markdown += `| **Insufficient** | 0-50 | Inadequate security controls requiring significant improvements |\n\n`;
    
    // Add footer with generation info
    markdown += `---\n\n`;
    markdown += `*Report generated on ${new Date().toLocaleString()} using CCI Calculator*\n`;
    
    // Create and save the file
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const timestamp = new Date().toISOString().split('T')[0];
    const sanitizedOrgName = sanitizeFilename(result.organization);
    const filename = `SEBI_CSCRF_Report_${sanitizedOrgName}_${timestamp}.md`;
    
    saveAs(blob, filename);
    
    // Toast notification
    toast.dismiss('markdown-export');
    toast.success('Markdown document exported successfully!');
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating Markdown document:', error);
    toast.dismiss('markdown-export');
    toast.error('Failed to export Markdown document');
    return Promise.reject(error);
  }
};

/**
 * Generate and export SEBI CSCRF report in PDF format optimized for SEBI submission
 * 
 * @param parameters The complete set of CCIParameters with values
 * @param result The calculated CCIResult with scores
 * @param annexureKData Optional Annexure K form data
 */
export const exportToPdf = async (
  parameters: CCIParameter[],
  result: CCIResult,
  annexureKData?: AnnexureKData
) => {
  try {
    // Display loading indicator
    toast('Generating compact SEBI submission report (under 10 pages)...', { 
      id: 'pdf-export',
      duration: 15000 // Increased duration since the report is more comprehensive now
    });

    // Create new PDF document - A4 format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Set properties for official document
    doc.setProperties({
      title: `SEBI CSCRF Report - ${result.organization}`,
      subject: 'Cyber Capability Index Assessment',
      author: result.organization,
      keywords: 'SEBI, CSCRF, Cybersecurity, Compliance',
      creator: 'CCI Calculator'
    });
    
    // Define constants for page layout
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = { left: 14, right: 14 };
    const contentWidth = pageWidth - margin.left - margin.right;
    
    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SEBI CSCRF Compliance Report', 105, 15, { align: 'center' });
    
    // Organization details in larger, more prominent format
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Organization: ${result.organization}`, 14, 25);
    doc.setFontSize(12);
    doc.text(`Assessment Date: ${new Date(result.date).toLocaleDateString('en-GB')}`, 14, 32);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 38);
    
    // Executive summary - more compact
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, 48);
    
    // Summary table - more compact
    autoTable(doc, {
      startY: 48,
      head: [['Metric', 'Value']],
      body: [
        ['Overall CCI Score', `${result.totalScore.toFixed(2)}%`],
        ['Maturity Level', result.maturityLevel],
        ['Compliance Status', result.totalScore >= 60 ? 'Compliant' : 'Non-Compliant']
      ],
      headStyles: { 
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 }
      },
      margin: margin,
    });
    
    // Group parameters by framework category
    const paramsByCategory: Record<string, CCIParameter[]> = {};
    parameters.forEach(param => {
      const category = param.frameworkCategory || 'Uncategorized';
      if (!paramsByCategory[category]) {
        paramsByCategory[category] = [];
      }
      paramsByCategory[category].push(param);
    });
    
    // Define standard categories
    const mainCategoryOrder = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
    
    // Calculate main category scores - we'll use this in multiple places
    const mainCategoryScores: Record<string, { score: number, maturityLevel: string, totalWeightage: number, compliant: boolean }> = {};
    
    mainCategoryOrder.forEach(mainCat => {
      // Find parameters that belong to this main category
      const relevantParams = parameters.filter(param => {
        if (!param.frameworkCategory) return false;
        return param.frameworkCategory.startsWith(mainCat);
      });
      
      if (relevantParams.length > 0) {
        const totalWeightage = relevantParams.reduce((sum, param) => sum + param.weightage, 0);
        const weightedSum = relevantParams.reduce((sum, param) => sum + calculateWeightedScore(param), 0);
        const score = totalWeightage > 0 ? (weightedSum / totalWeightage) * 100 : 0;
        
        // Determine maturity level
        let maturityLevel = "Insufficient";
        if (score >= 91) maturityLevel = "Exceptional";
        else if (score >= 81) maturityLevel = "Optimal";
        else if (score >= 71) maturityLevel = "Manageable";
        else if (score >= 61) maturityLevel = "Developing";
        else if (score >= 51) maturityLevel = "Bare Minimum";
        
        mainCategoryScores[mainCat] = {
          score,
          maturityLevel,
          totalWeightage,
          compliant: score >= 60
        };
      }
    });
    
    // Maturity Description - more compact
    const descriptionY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Maturity Description', 14, descriptionY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Trim description and add line breaks for conciseness
    const splitDesc = doc.splitTextToSize(result.maturityDescription, contentWidth);
    doc.text(splitDesc, 14, descriptionY + 5);
    
    // Category Analysis Section - Start on same page if room
    let currentY = doc.getTextDimensions(splitDesc).h + descriptionY + 10;
    
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 15;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Analysis', 14, currentY);
    
    // Setup category table data - more compact
    const categoryTableHead = [['Category', 'Score', 'Maturity Level', 'Status']];
    const categoryTableBody = mainCategoryOrder
      .filter(cat => mainCategoryScores[cat])
      .map(cat => {
        const { score, maturityLevel, compliant } = mainCategoryScores[cat];
        const status = compliant ? 'Compliant' : 'Non-Compliant';
        
        return [cat, score.toFixed(1), maturityLevel, status];
      });
    
    // Draw category table - more compact
    autoTable(doc, {
      startY: currentY + 4,
      head: categoryTableHead,
      body: categoryTableBody,
      headStyles: { 
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      margin: margin,
    });
    
    // Maturity description reference - combine with Category Maturity Classification to save space
    currentY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Maturity Classification', 14, currentY);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Detailed breakdown of maturity levels by security domain with reference levels', 14, currentY + 5);
    
    // Draw maturity reference table - more compact
    autoTable(doc, {
      startY: currentY + 8,
      head: [['Level', 'Score Range', 'Description']],
      body: [
        ['Exceptional', '91-100', 'Leading-edge security posture with advanced capabilities'],
        ['Optimal', '81-90', 'Robust security program with well-integrated controls'],
        ['Manageable', '71-80', 'Established security program with consistent implementation'],
        ['Developing', '61-70', 'Basic security controls with some gaps in implementation'],
        ['Bare Minimum', '51-60', 'Minimal security controls meeting basic requirements'],
        ['Insufficient', '0-50', 'Inadequate security controls requiring significant improvements']
      ],
      headStyles: { 
        fillColor: [80, 80, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8
      },
      margin: margin,
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 30 },
        1: { cellWidth: 25 }
      }
    });
    
    // More compact domain cards - 3 columns if possible
    currentY = (doc as any).lastAutoTable.finalY + 8;
    const cardWidth = 60;
    const cardHeight = 36;
    const cardsPerRow = 3;
    const cardMargin = 4;
    let cardCol = 0;
    let rowY = currentY;
    
    // Add domain cards
    mainCategoryOrder.forEach(main => {
      if (mainCategoryScores[main]) {
        // Need a new row?
        if (cardCol >= cardsPerRow) {
          cardCol = 0;
          rowY += cardHeight + cardMargin;
        }
        
        // Need a new page?
        if (rowY + cardHeight > pageHeight - 15) {
          doc.addPage();
          rowY = 15;
          cardCol = 0;
        }
        
        const { score, maturityLevel, totalWeightage, compliant } = mainCategoryScores[main];
        const cardX = margin.left + (cardCol * (cardWidth + cardMargin));
        
        // Create a card-like section
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(cardX, rowY, cardWidth, cardHeight, 2, 2, 'F');
        
        // Title
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(main, cardX + 4, rowY + 6);
        
        // Content
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Score: ${score.toFixed(1)}`, cardX + 4, rowY + 14);
        doc.text(`Maturity: ${maturityLevel}`, cardX + 4, rowY + 20);
        
        // Status indicator with color
        const statusColor = compliant ? [0, 128, 0] : [180, 0, 0]; // Green or Red
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(compliant ? '✓ Compliant' : '✗ Non-Compliant', cardX + 4, rowY + 28);
        doc.setTextColor(0, 0, 0);
        
        // Increment column counter
        cardCol++;
      }
    });
    
    // Annexure K Section - optimize for space efficiency
    if (annexureKData) {
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Annexure K - SEBI Submission Form', 105, 15, { align: 'center' });
      
      // Combine Entity Details and CCI Score Summary in a compact layout
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Entity Details & CCI Summary', 14, 25);
      
      // Two-column layout for entity details and CCI scores
      const leftTableStartY = 30;
      
      // Left column: Entity Details
      autoTable(doc, {
        startY: leftTableStartY,
        body: [
          ['Organization', annexureKData.organization || result.organization],
          ['Entity Type', annexureKData.entityType || 'Not specified'],
          ['Entity Category', annexureKData.entityCategory || 'Not specified'],
          ['Assessment Period', annexureKData.period || 'Not specified'],
          ['Auditing Organization', annexureKData.auditingOrganization || 'Not specified']
        ],
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 }
        },
        tableWidth: 85,
        margin: { left: 14 }
      });
      
      // Right column: CCI Score Summary
      // Setup data for the score table
      const scoreTableBody = [
        ['Overall CCI', result.totalScore.toFixed(1), result.maturityLevel, result.totalScore >= 60 ? 'Compliant' : 'Non-Compliant']
      ];
      
      // Add category scores
      mainCategoryOrder.forEach(main => {
        if (mainCategoryScores[main]) {
          const { score, maturityLevel, compliant } = mainCategoryScores[main];
          scoreTableBody.push([main, score.toFixed(1), maturityLevel, compliant ? 'Compliant' : 'Non-Compliant']);
        }
      });
      
      // Right table with scores
      autoTable(doc, {
        startY: leftTableStartY,
        head: [['Domain', 'Score', 'Level', 'Status']],
        body: scoreTableBody,
        headStyles: { 
          fillColor: [70, 70, 70],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2
        },
        tableWidth: 85,
        margin: { left: 105 }
      });
      
      // Determine the tallest table's bottom position
      const entityTableEndY = (doc as any).lastAutoTable.finalY;
      
      // Rationale section
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Rationale for Self-Assessment', 14, entityTableEndY + 10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      const splitRationale = doc.splitTextToSize(annexureKData.rationale || 'Not provided', contentWidth);
      doc.text(splitRationale, 14, entityTableEndY + 16);
      
      // Signatory section - more compact
      const signatoryY = doc.getTextDimensions(splitRationale).h + entityTableEndY + 20;
      
      // Check if we need a new page for the signatory section
      if (signatoryY > pageHeight - 50) {
        doc.addPage();
        currentY = 15;
      } else {
        currentY = signatoryY;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Authorised Signatory Declaration', 14, currentY);
      
      // Signatory statement
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text([
        'I/ We hereby confirm that Cyber Capability Index (CCI) has been verified by me/ us and I/ We shall take',
        'the responsibility and ownership of the CCI report.'
      ], 14, currentY + 6);
      
      // Two-column layout for signatory details and signature
      const leftColWidth = 85;
      
      // Left column: Signatory details
      autoTable(doc, {
        startY: currentY + 14,
        body: [
          ['Name of Signatory', annexureKData.signatoryName || 'Not specified'],
          ['Designation', annexureKData.designation || 'Not specified']
        ],
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 2
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 40 }
        },
        tableWidth: leftColWidth,
        margin: { left: 14 }
      });
      
      // Right column: Signature field
      doc.setDrawColor(100);
      doc.setLineWidth(0.2);
      doc.line(105, currentY + 20, 185, currentY + 20);
      doc.setFontSize(8);
      doc.text('Signature', 105, currentY + 18);
      doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 105, currentY + 25);
    }
    
    // Detailed Parameter Analysis - create a new condensed format
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Detailed Parameter Assessment', 105, 15, { align: 'center' });
    
    // Sort categories by main category order
    const categories = Object.keys(paramsByCategory).sort((a, b) => {
      // Sort by main category first (using the mainCategoryOrder)
      const mainA = a.split(':')[0]?.trim() || a;
      const mainB = b.split(':')[0]?.trim() || b;
      
      const indexA = mainCategoryOrder.indexOf(mainA);
      const indexB = mainCategoryOrder.indexOf(mainB);
      
      if (indexA !== indexB) {
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      } else {
        return a.localeCompare(b);
      }
    });
    
    // Start position
    currentY = 20;
    
    // Process each category with condensed parameter tables
    categories.forEach((category, categoryIndex) => {
      const params = paramsByCategory[category];
      
      // Calculate category score
      const totalWeightage = params.reduce((sum, param) => sum + param.weightage, 0);
      const weightedSum = params.reduce((sum, param) => sum + calculateWeightedScore(param), 0);
      const categoryScore = totalWeightage > 0 ? (weightedSum / totalWeightage) * 100 : 0;
      
      // Get maturity level
      let maturityLevel = "Insufficient";
      if (categoryScore >= 91) maturityLevel = "Exceptional";
      else if (categoryScore >= 81) maturityLevel = "Optimal";
      else if (categoryScore >= 71) maturityLevel = "Manageable";
      else if (categoryScore >= 61) maturityLevel = "Developing";
      else if (categoryScore >= 51) maturityLevel = "Bare Minimum";
      
      // Check if we need a new page
      if (currentY > pageHeight - 30 || categoryIndex > 0) {
        doc.addPage();
        currentY = 15;
      }
      
      // Category header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${category} - Score: ${categoryScore.toFixed(1)} (${maturityLevel})`, 14, currentY);
      
      // Parameter table - extremely condensed
      const paramTableData = params.map(param => {
        const score = calculateParameterScore(param);
        const compliant = score >= 60;
        
        return [
          param.measureId,
          param.title,
          `${param.numerator}/${param.denominator}`,
          score.toFixed(1),
          compliant ? '✓' : '✗'
        ];
      });
      
      // Draw the parameter table
      autoTable(doc, {
        startY: currentY + 3,
        head: [['ID', 'Parameter', 'N/D', 'Score', 'Status']],
        body: paramTableData,
        headStyles: { 
          fillColor: [80, 80, 80],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: { top: 1, right: 2, bottom: 1, left: 2 }
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 15, halign: 'center' }
        },
        margin: margin,
        showHead: 'firstPage',
        didDrawPage: (data) => {
          // Add category header on new pages
          if (data.pageCount > 1 && data.cursor && data.cursor.y === data.settings.margin.top) {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`${category} - Score: ${categoryScore.toFixed(1)} (${maturityLevel})`, 14, data.cursor.y - 5);
          }
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
    });
    
    // Add Comprehensive Parameter Details section with implementation evidence and auditor comments
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprehensive Parameter Details', 105, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('As required for SEBI submission with implementation evidence and auditor verification', 105, 22, { align: 'center' });
    
    // Initialize starting Y position
    currentY = 30;
    
    // Prepare parameter tables for each category
    categories.forEach((category, categoryIndex) => {
      // Need a new page?
      if (categoryIndex > 0 && currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 15;
      }
      
      // Category header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(category, 14, currentY);
      currentY += 8;
      
      // Parameters in this category
      const params = paramsByCategory[category];
      
      // Table with parameter details
      autoTable(doc, {
        startY: currentY,
        head: [['Parameter ID', 'Title', 'Formula', 'N/D', 'Score']],
        body: params.map(param => {
          const score = calculateParameterScore(param);
          return [
            param.measureId,
            param.title,
            param.formula.length > 50 ? param.formula.substring(0, 47) + '...' : param.formula,
            `${param.numerator}/${param.denominator}`,
            `${score.toFixed(1)}%`
          ];
        }),
        headStyles: { 
          fillColor: [60, 60, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: { top: 1, right: 2, bottom: 1, left: 2 }
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 50 },
          2: { cellWidth: 70 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
        },
        margin: margin
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 5;
      
      // Process each parameter with detailed information but in a more compact format
      params.forEach((param, index) => {
        // Calculate parameter score
        const score = calculateParameterScore(param);
        const compliant = score >= 60;
        
        // Check if we need a new page
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = 15;
        }
        
        // Parameter header with border
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, currentY, contentWidth, 8, 1, 1, 'D');
        
        // Parameter ID and title
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        // Parameter status indicator with color
        const statusColor = compliant ? [0, 128, 0] : [180, 0, 0]; // Green or Red
        doc.text(`${param.measureId}: ${param.title}`, 17, currentY + 5);
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setFontSize(8);
        doc.text(`${score.toFixed(1)}% (${compliant ? 'Compliant' : 'Non-Compliant'})`, pageWidth - 17, currentY + 5, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        currentY += 12;
        
        // Implementation Evidence and Auditor Comments table
        autoTable(doc, {
          startY: currentY,
          head: [['Implementation Evidence', 'Auditor Comments']],
          body: [[
            param.implementationEvidence || 'Not specified',
            param.auditorComments || 'No comments provided'
          ]],
          headStyles: { 
            fillColor: [80, 80, 80],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: {
            fontSize: 7,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          margin: margin
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 5;
        
        // Only add detailed context for high-weightage parameters (to save space)
        if (param.weightage >= 5) {
          // Additional information table (standard context, best practices if available)
          if (param.standardContext || param.bestPractices) {
            // Check if we need a new page
            if (currentY > pageHeight - 40) {
              doc.addPage();
              currentY = 15;
            }
            
            let contextRows = [];
            if (param.standardContext) {
              contextRows.push(['Standard Context', param.standardContext]);
            }
            if (param.bestPractices) {
              contextRows.push(['Best Practices', param.bestPractices]);
            }
            
            if (contextRows.length > 0) {
              autoTable(doc, {
                startY: currentY,
                body: contextRows,
                theme: 'plain',
                styles: {
                  fontSize: 7,
                  cellPadding: 2,
                  overflow: 'linebreak',
                  lineColor: [220, 220, 220],
                  lineWidth: 0.1
                },
                columnStyles: {
                  0: { fontStyle: 'bold', cellWidth: 30 }
                },
                margin: margin
              });
              
              currentY = (doc as any).lastAutoTable.finalY + 8;
            }
          }
        }
      });
      
      // Add a little extra space between categories
      currentY += 5;
    });
    
    // Signature section at the end
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 15;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Verification and Approval', 105, currentY, { align: 'center' });
    
    // Signature boxes
    currentY += 10;
    doc.setDrawColor(100);
    doc.setLineWidth(0.2);
    
    // Draw three signature lines
    const signatureWidth = (contentWidth - 20) / 3;
    
    // Auditor signature
    doc.line(20, currentY + 15, 20 + signatureWidth, currentY + 15);
    doc.setFontSize(8);
    doc.text('Auditor Signature', 20, currentY + 20);
    
    // Compliance Officer signature
    doc.line(20 + signatureWidth + 10, currentY + 15, 20 + signatureWidth * 2 + 10, currentY + 15);
    doc.text('Compliance Officer', 20 + signatureWidth + 10, currentY + 20);
    
    // CEO/MD signature
    doc.line(20 + signatureWidth * 2 + 20, currentY + 15, 20 + signatureWidth * 3 + 20, currentY + 15);
    doc.text('CEO/MD', 20 + signatureWidth * 2 + 20, currentY + 20);
    
    // Date line
    doc.line(105, currentY + 35, 170, currentY + 35);
    doc.text('Date', 105, currentY + 40);
    
    // Add footer to each page
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(
        `SEBI CSCRF Report - ${result.organization} - Page ${i} of ${pageCount}`, 
        pageWidth / 2, 
        pageHeight - 8, 
        { align: 'center' }
      );
      
      // Add confidentiality note in the footer if there's room
      if (i === pageCount) {
        doc.text('CONFIDENTIAL - FOR REGULATORY SUBMISSION ONLY', pageWidth / 2, pageHeight - 4, { align: 'center' });
      }
    }
    
    // Save the PDF
    const sanitizedOrgName = sanitizeFilename(result.organization);
  const timestamp = new Date().toISOString().split('T')[0];
    const filename = `SEBI_CSCRF_Report_${sanitizedOrgName}_${timestamp}.pdf`;
    
    doc.save(filename);
    
    // Toast notification
    toast.dismiss('pdf-export');
    toast.success('Compact SEBI report exported successfully (under 10 pages)!');
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating PDF document:', error);
    toast.dismiss('pdf-export');
    toast.error('Failed to export PDF document');
    return Promise.reject(error);
  }
};

/**
 * Generate and export SEBI CSCRF report in CSV format for data analysis
 * 
 * @param parameters The complete set of CCIParameters with values
 * @param result The calculated CCIResult with scores
 */
export const exportToCsv = async (
  parameters: CCIParameter[],
  result: CCIResult
) => {
  try {
    // Display loading indicator
    toast('Generating CSV file...', { 
      id: 'csv-export',
      duration: 5000
    });

    // CSV header row
    let csv = 'Parameter ID,Title,Category,Score,Weightage,Numerator,Denominator,Weighted Score,Compliance Status\n';
    
    // Group parameters by framework category
    const paramsByCategory: Record<string, CCIParameter[]> = {};
    parameters.forEach(param => {
      const category = param.frameworkCategory || 'Uncategorized';
      if (!paramsByCategory[category]) {
        paramsByCategory[category] = [];
      }
      paramsByCategory[category].push(param);
    });
    
    // Process each parameter
    Object.keys(paramsByCategory).forEach(category => {
      paramsByCategory[category].forEach(param => {
        const score = calculateParameterScore(param);
        const weightedScore = calculateWeightedScore(param);
        const complianceStatus = score >= 60 ? 'Compliant' : 'Non-Compliant';
        
        // Escape any commas in text fields
        const escapedTitle = param.title.replace(/,/g, ' ');
        const escapedCategory = category.replace(/,/g, ' ');
        
        // Add row to CSV
        csv += `${param.measureId},${escapedTitle},${escapedCategory},${score.toFixed(2)},${param.weightage},${param.numerator},${param.denominator},${weightedScore.toFixed(2)},${complianceStatus}\n`;
      });
    });
    
    // Add summary rows
    csv += '\n';
    csv += 'SUMMARY\n';
    csv += `Organization,${result.organization}\n`;
    csv += `Assessment Date,${new Date(result.date).toLocaleDateString('en-GB')}\n`;
    csv += `Total CCI Score,${result.totalScore.toFixed(2)}\n`;
    csv += `Maturity Level,${result.maturityLevel}\n`;
    csv += `Compliance Status,${result.totalScore >= 60 ? 'Compliant' : 'Non-Compliant'}\n`;
    
    // Add category scores
    csv += '\nCATEGORY SCORES\n';
    csv += 'Category,Score,Maturity Level,Compliance Status\n';
    
    // Calculate category scores
    const mainCategoryOrder = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
    
    mainCategoryOrder.forEach(mainCat => {
      // Find parameters that belong to this main category
      const relevantParams = parameters.filter(param => {
        if (!param.frameworkCategory) return false;
        return param.frameworkCategory.startsWith(mainCat);
      });
      
      if (relevantParams.length > 0) {
        const totalWeightage = relevantParams.reduce((sum, param) => sum + param.weightage, 0);
        const weightedSum = relevantParams.reduce((sum, param) => sum + calculateWeightedScore(param), 0);
        const score = totalWeightage > 0 ? (weightedSum / totalWeightage) * 100 : 0;
        
        // Determine maturity level
        let maturityLevel = "Insufficient";
        if (score >= 91) maturityLevel = "Exceptional";
        else if (score >= 81) maturityLevel = "Optimal";
        else if (score >= 71) maturityLevel = "Manageable";
        else if (score >= 61) maturityLevel = "Developing";
        else if (score >= 51) maturityLevel = "Bare Minimum";
        
        const complianceStatus = score >= 60 ? 'Compliant' : 'Non-Compliant';
        
        csv += `${mainCat},${score.toFixed(2)},${maturityLevel},${complianceStatus}\n`;
      }
    });
    
    // Create and save the file
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const sanitizedOrgName = sanitizeFilename(result.organization);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `SEBI_CSCRF_Data_${sanitizedOrgName}_${timestamp}.csv`;
    
    saveAs(blob, filename);
    
    // Toast notification
    toast.dismiss('csv-export');
    toast.success('CSV file exported successfully!');
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating CSV file:', error);
    toast.dismiss('csv-export');
    toast.error('Failed to export CSV file');
    return Promise.reject(error);
  }
};

/**
 * Export a compact SEBI report containing only the comprehensive parameter details
 * for submission purposes (<10 pages).
 */
export const exportCompactSebiReport = async (
  parameters: CCIParameter[],
  result: CCIResult,
  annexureKData?: AnnexureKData
) => {
  try {
    // Display loading indicator
    toast('Generating parameters-only SEBI report...', { 
      id: 'compact-pdf-export',
      duration: 8000
    });

    // Create new PDF document - A4 format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Set properties for official document
    doc.setProperties({
      title: `SEBI CSCRF Parameter Report - ${result.organization}`,
      subject: 'Cyber Capability Index Parameter Assessment',
      author: result.organization,
      keywords: 'SEBI, CSCRF, Cybersecurity, Compliance, Parameters',
      creator: 'CCI Calculator'
    });
    
    // Define constants for page layout
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = { left: 14, right: 14 };
    const contentWidth = pageWidth - margin.left - margin.right;
    
    // Add header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('SEBI CSCRF Comprehensive Parameter Report', 105, 15, { align: 'center' });
    
    // Organization details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Organization: ${result.organization}`, 14, 25);
    doc.setFontSize(10);
    doc.text(`Assessment Date: ${new Date(result.date).toLocaleDateString('en-GB')}`, 14, 32);
    doc.text(`Report Generated: ${new Date().toLocaleDateString('en-GB')}`, 14, 38);
    
    // Add Comprehensive Parameter Details section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprehensive Parameter Details', 105, 48, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('As required for SEBI submission with implementation evidence and auditor verification', 105, 54, { align: 'center' });
    
    // Group parameters by framework category
    const paramsByCategory: Record<string, CCIParameter[]> = {};
    parameters.forEach(param => {
      const category = param.frameworkCategory || 'Uncategorized';
      if (!paramsByCategory[category]) {
        paramsByCategory[category] = [];
      }
      paramsByCategory[category].push(param);
    });
    
    // Define standard categories
    const mainCategoryOrder = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
    
    // Sort categories by main category order
    const categories = Object.keys(paramsByCategory).sort((a, b) => {
      // Sort by main category first (using the mainCategoryOrder)
      const mainA = a.split(':')[0]?.trim() || a;
      const mainB = b.split(':')[0]?.trim() || b;
      
      const indexA = mainCategoryOrder.indexOf(mainA);
      const indexB = mainCategoryOrder.indexOf(mainB);
      
      if (indexA !== indexB) {
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      } else {
        return a.localeCompare(b);
      }
    });
    
    // Initialize starting Y position
    let currentY = 62;
    
    // Prepare parameter tables for each category
    categories.forEach((category, categoryIndex) => {
      // Need a new page?
      if (categoryIndex > 0 && currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 15;
      }
      
      // Category header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(category, 14, currentY);
      
      // Parameters in this category
      const params = paramsByCategory[category];
      
      // Table with parameter details
      autoTable(doc, {
        startY: currentY + 4,
        head: [['Parameter ID', 'Title', 'Formula', 'N/D', 'Score', 'ID']],
        body: params.map(param => {
          const score = calculateParameterScore(param);
          return [
            param.measureId,
            param.title,
            param.formula.length > 30 ? param.formula.substring(0, 27) + '...' : param.formula,
            `${param.numerator}/${param.denominator}`,
            `${score.toFixed(1)}%`,
            param.id.toString()
          ];
        }),
        headStyles: { 
          fillColor: [60, 60, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: { top: 1, right: 2, bottom: 1, left: 2 }
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 50 },
          2: { cellWidth: 70 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 8, halign: 'center' }
        },
        margin: margin
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 5;
      
      // Process each parameter with detailed information
      params.forEach((param, index) => {
        // Calculate parameter score
        const score = calculateParameterScore(param);
        const compliant = score >= 60;
        
        // Check if we need a new page
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = 15;
        }
        
        // Parameter header with border
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, currentY, contentWidth, 8, 1, 1, 'D');
        
        // Parameter ID and title
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        
        // Parameter status indicator with color
        const statusColor = compliant ? [0, 128, 0] : [180, 0, 0]; // Green or Red
        doc.text(`${param.measureId}: ${param.title}`, 17, currentY + 5);
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setFontSize(8);
        doc.text(`${score.toFixed(1)}% (${compliant ? 'Compliant' : 'Non-Compliant'})`, pageWidth - 17, currentY + 5, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        
        currentY += 12;
        
        // Implementation Evidence and Auditor Comments table
        autoTable(doc, {
          startY: currentY,
          head: [['Implementation Evidence', 'Auditor Comments']],
          body: [[
            param.implementationEvidence || 'Not specified',
            param.auditorComments || 'No comments provided'
          ]],
          headStyles: { 
            fillColor: [80, 80, 80],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: {
            fontSize: 7,
            cellPadding: 3,
            lineColor: [200, 200, 200],
            lineWidth: 0.1
          },
          margin: margin
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 5;
        
        // Add Standard Context if available
        if (param.standardContext) {
          // Check if we need a new page
          if (currentY > pageHeight - 40) {
            doc.addPage();
            currentY = 15;
          }
          
          autoTable(doc, {
            startY: currentY,
            body: [['Standard Context', param.standardContext]],
            theme: 'plain',
            styles: {
              fontSize: 7,
              cellPadding: 2,
              overflow: 'linebreak',
              lineColor: [220, 220, 220],
              lineWidth: 0.1
            },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 30 }
            },
            margin: margin
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 5;
        }
        
        // Add Best Practices if available
        if (param.bestPractices) {
          // Check if we need a new page
          if (currentY > pageHeight - 40) {
            doc.addPage();
            currentY = 15;
          }
          
          autoTable(doc, {
            startY: currentY,
            body: [['Best Practices', param.bestPractices]],
            theme: 'plain',
            styles: {
              fontSize: 7,
              cellPadding: 2,
              overflow: 'linebreak',
              lineColor: [220, 220, 220],
              lineWidth: 0.1
            },
            columnStyles: {
              0: { fontStyle: 'bold', cellWidth: 30 }
            },
            margin: margin
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 8;
        }
      });
    });
    
    // Add verification section
    if (currentY > pageHeight - 40) {
      doc.addPage();
      currentY = 15;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Verification and Approval', 105, currentY, { align: 'center' });
    
    // Signature table
    currentY += 10;
    autoTable(doc, {
      startY: currentY,
      body: [['Auditor Signature', 'Compliance Officer', 'CEO/MD']],
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      margin: margin
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: currentY,
      body: [['Date', '', '']],
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      margin: margin
    });
    
    // Page numbers
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`SEBI CSCRF Report - ${result.organization} - Page ${i} of ${totalPages}`, 105, pageHeight - 10, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = `SEBI_CSCRF_ParameterReport_${sanitizeFilename(result.organization)}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast.success('Parameters-only SEBI report successfully generated!', { id: 'compact-pdf-export' });
    
    return true;
  } catch (error) {
    console.error('Error generating parameters-only SEBI report:', error);
    toast.error('Failed to generate parameters-only SEBI report');
    return false;
  }
};

/**
 * Export only the Annexure K report as a PDF document
 * 
 * @param data An object containing all the required data for the report
 */
export const exportAnnexureKReport = async (data: {
  organizationName: string,
  assessmentDate: string,
  annexureKData: AnnexureKData,
  cciScore: number,
  categoryScores: Record<string, { score: number, maturityLevel: string }>
}) => {
  try {
    // Display loading indicator
    toast('Generating Annexure K report...', { 
      id: 'annexure-k-export',
      duration: 5000
    });

    // Create new PDF document - A4 format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Set properties for official document
    doc.setProperties({
      title: `SEBI CSCRF Annexure K - ${data.organizationName}`,
      subject: 'Annexure K for SEBI CSCRF Compliance',
      author: data.organizationName,
      keywords: 'SEBI, CSCRF, Annexure K, Compliance',
      creator: 'CCI Calculator'
    });
    
    // Define constants for page layout
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = { left: 14, right: 14 };
    const contentWidth = pageWidth - margin.left - margin.right;
    
    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Annexure K - SEBI CSCRF', 105, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('Authorized Signatory Declaration Form', 105, 25, { align: 'center' });
    
    // Entity Details section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Entity Details', 14, 40);
    
    // Entity details table
    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Information']],
      body: [
        ['Organization', data.annexureKData.organization || data.organizationName],
        ['Entity Type', data.annexureKData.entityType || 'Not specified'],
        ['Entity Category', data.annexureKData.entityCategory || 'Not specified'],
        ['Assessment Period', data.annexureKData.period || 'Not specified'],
        ['Auditing Organization', data.annexureKData.auditingOrganization || 'Not specified']
      ],
      headStyles: { 
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 10
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 }
      },
      margin: margin
    });
    
    // Rationale section
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Rationale for Assessment', 14, currentY);
    
    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Handle long text with word wrapping
    const splitRationale = doc.splitTextToSize(data.annexureKData.rationale || 'Not provided', contentWidth);
    doc.text(splitRationale, 14, currentY);
    
    // Determine new Y position after text
    currentY += doc.getTextDimensions(splitRationale).h + 20;
    
    // Check if we need a new page
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = 15;
    }
    
    // Signatory section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory Declaration', 14, currentY);
    
    currentY += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Signatory statement
    doc.text([
      'I/We hereby confirm that Cyber Capability Index (CCI) has been verified by me/us and I/We shall take',
      'the responsibility and ownership of the CCI report.'
    ], 14, currentY);
    
    currentY += 20;
    
    // Signatory details table
    autoTable(doc, {
      startY: currentY,
      body: [
        ['Name of Signatory', data.annexureKData.signatoryName || 'Not specified'],
        ['Designation', data.annexureKData.designation || 'Not specified']
      ],
      theme: 'plain',
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 }
      },
      margin: margin
    });
    
    // Signature field
    currentY = (doc as any).lastAutoTable.finalY + 15;
    doc.setDrawColor(100);
    doc.setLineWidth(0.2);
    doc.line(14, currentY + 20, 105, currentY + 20);
    doc.setFontSize(9);
    doc.text('Signature', 14, currentY + 25);
    
    // Date field
    doc.line(115, currentY + 20, 195, currentY + 20);
    doc.text('Date', 115, currentY + 25);
    
    // CCI Score summary
    currentY += 40;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('CCI Score Summary', 14, currentY);
    
    currentY += 10;
    
    // Get maturity level based on score
    let maturityLevel = "Insufficient";
    if (data.cciScore >= 91) maturityLevel = "Exceptional";
    else if (data.cciScore >= 81) maturityLevel = "Optimal";
    else if (data.cciScore >= 71) maturityLevel = "Manageable";
    else if (data.cciScore >= 61) maturityLevel = "Developing";
    else if (data.cciScore >= 51) maturityLevel = "Bare Minimum";
    
    // Summary table
    autoTable(doc, {
      startY: currentY,
      head: [['Metric', 'Value']],
      body: [
        ['Overall CCI Score', `${data.cciScore.toFixed(2)}%`],
        ['Maturity Level', maturityLevel],
        ['Compliance Status', data.cciScore >= 60 ? 'Compliant' : 'Non-Compliant']
      ],
      headStyles: { 
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 10
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 }
      },
      margin: margin
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Domain scores table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Domain Scores', 14, currentY);
    
    currentY += 10;
    
    // Sort domain categories for consistent order
    const categoryOrder = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
    const sortedCategories = Object.keys(data.categoryScores).sort((a, b) => {
      return categoryOrder.indexOf(a) - categoryOrder.indexOf(b);
    });
    
    // Create table body for domain scores
    const domainTableBody = sortedCategories.map(category => {
      const { score, maturityLevel } = data.categoryScores[category];
      const compliant = score >= 60;
      return [
        category,
        `${score.toFixed(1)}%`, 
        maturityLevel,
        compliant ? 'Compliant' : 'Non-Compliant'
      ];
    });
    
    // Domain scores table
    autoTable(doc, {
      startY: currentY,
      head: [['Domain', 'Score', 'Maturity Level', 'Status']],
      body: domainTableBody,
      headStyles: { 
        fillColor: [50, 50, 50],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 10
      },
      margin: margin
    });
    
    // Footer with SEBI reference
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('As per SEBI CSCRF requirements - Annexure K submission', 14, pageHeight - 10);
    
    // Page numbers
    doc.text(`Page 1 of 1`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    
    // Save the PDF
    const fileName = `Annexure_K_${sanitizeFilename(data.organizationName)}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    toast.success('Annexure K report successfully generated!', { id: 'annexure-k-export' });
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating Annexure K report:', error);
    toast.error('Failed to generate Annexure K report');
    return Promise.reject(error);
  }
}; 

/**
 * Export SBOM document in a SEBI-compliant format as a PDF document
 * 
 * @param organizationName Organization name for the report
 * @param sbomRegistry The SBOM registry containing documents and critical systems
 * @param assessmentDate The date of the assessment
 */
export const exportSBOMDocument = async (
  organizationName: string,
  sbomRegistry: { sbomDocuments: any[], criticalSystems: string[] },
  assessmentDate: string
) => {
  try {
    // Display loading indicator
    toast('Generating SBOM export for SEBI submission...', { 
      id: 'sbom-export',
      duration: 5000
    });

    // Create new PDF document - A4 format
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // Set properties for official document
    doc.setProperties({
      title: `SEBI CSCRF - SBOM Report - ${organizationName}`,
      subject: 'Software Bill of Materials for SEBI CSCRF Compliance',
      author: organizationName,
      keywords: 'SEBI, CSCRF, SBOM, Compliance, Cybersecurity',
      creator: 'CCI Calculator'
    });
    
    // Define constants for page layout
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = { left: 14, right: 14 };
    const contentWidth = pageWidth - margin.left - margin.right;
    
    // Add header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SEBI CSCRF Compliance', 105, 15, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Software Bill of Materials (SBOM) Report', 105, 25, { align: 'center' });
    
    // Add organization details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Organization: ${organizationName}`, 14, 40);
    doc.text(`Assessment Date: ${assessmentDate}`, 14, 46);
    doc.text(`Report Generation Date: ${new Date().toLocaleDateString()}`, 14, 52);
    
    // Add SBOM coverage details
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SBOM Coverage Summary', 14, 65);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Critical Systems: ${sbomRegistry.criticalSystems.length}`, 14, 72);
    doc.text(`Systems with SBOM Documentation: ${sbomRegistry.sbomDocuments.length}`, 14, 78);
    
    const coveragePercentage = sbomRegistry.criticalSystems.length > 0 
      ? Math.round((sbomRegistry.sbomDocuments.length / sbomRegistry.criticalSystems.length) * 100) 
      : 0;
    
    // SBOM Coverage Status
    const complianceStatus = coveragePercentage >= 100 ? 'Compliant' : 'Non-Compliant';
    const statusColor = coveragePercentage >= 100 ? [0, 128, 0] : [180, 0, 0]; // Green or Red
    
    doc.text(`Coverage Percentage: ${coveragePercentage}%`, 14, 84);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(`SBOM Compliance Status: ${complianceStatus}`, 14, 90);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    // Add Critical Systems List
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Critical Systems', 14, 105);
    
    // Critical systems table
    const criticalSystemsData = sbomRegistry.criticalSystems.map((system, index) => {
      return [
        (index + 1).toString(),
        system,
        sbomRegistry.sbomDocuments.some(doc => doc.name === system) ? 'Available' : 'Missing'
      ];
    });
    
    if (criticalSystemsData.length === 0) {
      criticalSystemsData.push(['', 'No critical systems defined', '']);
    }
    
    autoTable(doc, {
      startY: 110,
      head: [['#', 'System Name', 'SBOM Status']],
      body: criticalSystemsData,
      headStyles: { 
        fillColor: [80, 80, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30, halign: 'center' }
      },
      margin: margin
    });
    
    // Get position after the table
    let currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // SBOM Documents section
    doc.addPage();
    currentY = 15;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SBOM Documents', 14, currentY);
    currentY += 10;
    
    // Process each SBOM document
    sbomRegistry.sbomDocuments.forEach((sbomDoc, index) => {
      // Document header
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 15;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`SBOM #${index + 1}: ${sbomDoc.name} v${sbomDoc.version}`, 14, currentY);
      currentY += 8;
      
      // Document details
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Supplier: ${sbomDoc.supplier}`, 14, currentY);
      currentY += 5;
      doc.text(`Creation Date: ${sbomDoc.dateCreated}`, 14, currentY);
      currentY += 5;
      doc.text(`Last Updated: ${sbomDoc.lastUpdated}`, 14, currentY);
      currentY += 5;
      doc.text(`Update Frequency: ${sbomDoc.updateFrequency}`, 14, currentY);
      currentY += 5;
      doc.text(`Encryption: ${sbomDoc.encryptionUsed}`, 14, currentY);
      currentY += 5;
      doc.text(`Access Control: ${sbomDoc.accessControl}`, 14, currentY);
      currentY += 5;
      doc.text(`Error Handling: ${sbomDoc.errorHandlingMethod}`, 14, currentY);
      currentY += 10;
      
      // Components table
      const componentsData = sbomDoc.components.map((component, idx) => {
        return [
          (idx + 1).toString(),
          component.name,
          component.version,
          component.supplier,
          component.license
        ];
      });
      
      if (componentsData.length === 0) {
        componentsData.push(['', 'No components defined', '', '', '']);
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Components:', 14, currentY);
      currentY += 5;
      
      autoTable(doc, {
        startY: currentY,
        head: [['#', 'Component', 'Version', 'Supplier', 'License']],
        body: componentsData,
        headStyles: { 
          fillColor: [100, 100, 100],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8
        },
        bodyStyles: {
          fontSize: 7,
          cellPadding: { top: 1, right: 2, bottom: 1, left: 2 }
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 40 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 40 },
          4: { cellWidth: 30 }
        },
        margin: margin
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Known Unknowns
      if (sbomDoc.knownUnknowns && sbomDoc.knownUnknowns.length > 0) {
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = 15;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Known Unknowns:', 14, currentY);
        currentY += 5;
        
        const knownUnknownsData = sbomDoc.knownUnknowns.map((item, idx) => {
          return [(idx + 1).toString(), item];
        });
        
        autoTable(doc, {
          startY: currentY,
          head: [['#', 'Description']],
          body: knownUnknownsData,
          headStyles: { 
            fillColor: [100, 100, 100],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: {
            fontSize: 7
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 'auto' }
          },
          margin: margin
        });
        
        currentY = (doc as any).lastAutoTable.finalY + 15;
      }
      
      // Add notes if they exist
      if (sbomDoc.notes) {
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = 15;
        }
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 14, currentY);
        currentY += 5;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Split notes into multiple lines to fit page width
        const noteLines = doc.splitTextToSize(sbomDoc.notes, contentWidth - 5);
        doc.text(noteLines, 14, currentY);
        currentY += noteLines.length * 4 + 10;
      }
      
      // Add divider between documents
      if (index < sbomRegistry.sbomDocuments.length - 1) {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = 15;
        } else {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(14, currentY, pageWidth - 14, currentY);
          currentY += 15;
        }
      }
    });
    
    // Add SEBI compliance page
    doc.addPage();
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SEBI CSCRF SBOM Compliance Declaration', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('This Software Bill of Materials (SBOM) report is prepared in accordance with the', 105, 30, { align: 'center' });
    doc.text('Securities and Exchange Board of India (SEBI) Cyber Security & Cyber Resilience Framework.', 105, 35, { align: 'center' });
    
    // Compliance statement
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    if (complianceStatus === 'Compliant') {
      doc.setTextColor(0, 128, 0);
      doc.text('✓ All critical systems have associated SBOMs as required by SEBI CSCRF', 105, 50, { align: 'center' });
    } else {
      doc.setTextColor(180, 0, 0);
      doc.text('⚠ Not all critical systems have associated SBOMs as required by SEBI CSCRF', 105, 50, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Immediate action required to ensure compliance', 105, 55, { align: 'center' });
    }
    doc.setTextColor(0, 0, 0);
    
    // Signature block
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Authorized by:', 50, 80);
    doc.text('Date:', 150, 80);
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(50, 95, 120, 95); // Signature line
    doc.line(150, 95, 180, 95); // Date line
    
    doc.text('Name and Title:', 50, 105);
    doc.line(50, 115, 120, 115); // Name line
    
    // Add SEBI Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('This document is prepared in compliance with SEBI Circular SEBI/HO/MIRSD/MIRSD_CRADT/CIR/P/2022/03', 105, 280, { align: 'center' });
    
    // Save the PDF
    doc.save(`SEBI-CSCRF-SBOM-Report-${organizationName.replace(/\s+/g, '_')}-${new Date().toISOString().split('T')[0]}.pdf`);
    
    // Success notification
    toast.success('SBOM report exported successfully for SEBI submission!');
    return true;
  } catch (error) {
    console.error('Error exporting SBOM report:', error);
    toast.error('Failed to export SBOM report. See console for details.');
    return false;
  }
};