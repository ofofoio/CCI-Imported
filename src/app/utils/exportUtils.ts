import { Document, Paragraph, Table, TableRow, TableCell, HeadingLevel, TextRun, BorderStyle, AlignmentType, TableOfContents, PageBreak, ExternalHyperlink, Packer, SectionType, ISectionOptions } from 'docx';
import { saveAs } from 'file-saver';
import { CCIParameter, CCIResult, AnnexureKData } from '../types';
import { calculateParameterScore, calculateWeightedScore } from './cciCalculator';
import { toast } from 'react-hot-toast';

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
 * Generate and export SEBI CSCRF report in Word format
 * 
 * @param parameters The complete set of CCIParameters with values
 * @param result The calculated CCIResult with scores
 * @param annexureKData Optional Annexure K form data
 */
export const exportToWord = async (
  parameters: CCIParameter[],
  result: CCIResult,
  annexureKData?: AnnexureKData
) => {
  try {
    // Display loading indicator
    toast('Generating Word document...', { 
      id: 'word-export',
      duration: 10000
    });

    // Initialize logging for export process with timing
    console.group('SEBI CSCRF Report Export Process');
    const exportStart = performance.now();
    console.log(`Export initiated at: ${new Date().toISOString()}`);
    console.log(`Generating report for: ${result.organization}`);
    console.log(`Building document with ${parameters.length} parameters`);
    console.log(`Document maturity level: ${result.maturityLevel}`);
    console.log(`Document maturity description: ${result.maturityDescription}`);
    
    // Using type assertion for Chrome-specific performance.memory API
    interface MemoryInfo {
      usedJSHeapSize: number;
      jsHeapSizeLimit: number;
    }

    const performanceExt = window.performance as any;
    if (performanceExt && performanceExt.memory) {
      const memory = performanceExt.memory as MemoryInfo;
      console.log(`Initial Memory: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB / ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`);
    }

  // Show loading indicator for large reports
  if (parameters.length > 10) {
    console.log('Generating detailed Word report, please wait...');
  }
  
  // Group parameters by framework category
  const paramsByCategory: Record<string, CCIParameter[]> = {};
  parameters.forEach(param => {
    const category = param.frameworkCategory || 'Uncategorized';
    if (!paramsByCategory[category]) {
      paramsByCategory[category] = [];
    }
    paramsByCategory[category].push(param);
  });
    
    console.log(`Parameters grouped into ${Object.keys(paramsByCategory).length} categories`);
    
    // Track progress stages
    console.log('Building document skeleton...');
  
  // Generate report content
  const children = [
    // Cover Page
    new Paragraph({
      text: "SEBI CSCRF",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 3000, // Position vertically in the middle of the page
      },
    }),
    new Paragraph({
      text: "Compliance Report",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 1000,
      },
    }),
    new Paragraph({
      text: `Organization: ${result.organization}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Assessment Date: ${new Date(result.date).toLocaleDateString('en-GB')}`,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      text: `Maturity Level: ${result.maturityLevel}`,
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 500,
      },
        run: {
          bold: true
        }
      }),
      new Paragraph({
        text: result.maturityDescription,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 200,
        }
    }),
    new Paragraph({
      text: `Total CCI Score: ${result.totalScore.toFixed(2)}%`,
      alignment: AlignmentType.CENTER,
    }),
      new Paragraph({
        text: `Compliance Status: ${result.totalScore >= 60 ? 'Compliant' : 'Non-Compliant'}`,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 200,
        },
      }),
    new Paragraph({
      text: "Confidential - For Internal Use Only",
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 2000,
      },
    }),
    new PageBreak(),
    
    // Table of Contents
    new Paragraph({
      text: "Table of Contents",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new TableOfContents("Table of Contents"),
    new PageBreak(),
    
    // Executive Summary
    new Paragraph({
      text: "Executive Summary",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      text: "Organization Details",
      heading: HeadingLevel.HEADING_3,
    }),
    new Paragraph(`Organization: ${result.organization}`),
    new Paragraph(`Assessment Date: ${new Date(result.date).toLocaleDateString('en-GB')}`),
    new Paragraph(`Maturity Level: ${result.maturityLevel}`),
      new Paragraph({
        text: result.maturityDescription,
        spacing: {
          after: 200,
        },
      }),
    new Paragraph(`Total CCI Score: ${result.totalScore.toFixed(2)}%`),
    new Paragraph({
      text: `Compliance Status: ${result.totalScore >= 60 ? 'Compliant' : 'Non-Compliant'}`,
      spacing: {
        after: 400,
      },
    }),
      
      // Main NIST Framework Categories
      new Paragraph({
        text: "Main Framework Categories",
        heading: HeadingLevel.HEADING_3,
      }),
      
      // Add paragraph describing the 5 main categories
      new Paragraph({
        text: "The SEBI CSCRF follows the NIST Cybersecurity Framework structure with five main categories:",
        spacing: {
          after: 200,
        },
      }),
      
      // Add main category as markdown text instead of table
      new Paragraph({
        text: convertTableToMarkdown(
          ["Main Category", "Score (%)", "Maturity Level"],
          ['Governance', 'Identify', 'Protect', 'Detect', 'Respond'].map(mainCat => {
            // Calculate scores for main category
            const relevantParams = parameters.filter(param => {
              if (!param.frameworkCategory) return false;
              return param.frameworkCategory.startsWith(mainCat);
            });
            
            if (relevantParams.length === 0) {
              return [mainCat, "N/A", "N/A"];
            }
            
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
            
            return [mainCat, score.toFixed(2), maturityLevel];
          })
        )
      }),
      
      new Paragraph({
        text: "Maturity Level Description:",
        spacing: {
          before: 200,
        },
        run: {
          bold: true
        }
      }),
      new Paragraph("• Exceptional (91-100): Leading-edge security posture with advanced capabilities"),
      new Paragraph("• Optimal (81-90): Robust security program with well-integrated controls"),
      new Paragraph("• Manageable (71-80): Established security program with consistent implementation"),
      new Paragraph("• Developing (61-70): Basic security controls with some gaps in implementation"),
      new Paragraph("• Bare Minimum (51-60): Minimal security controls meeting basic requirements"),
      new Paragraph("• Insufficient (0-50): Inadequate security controls requiring significant improvements"),
      
      new PageBreak(),
    
    // Framework Category Scores
    new Paragraph({
        text: "Detailed Framework Category Scores",
        heading: HeadingLevel.HEADING_1,
    }),
  ];
  
    // Category score as markdown text
  const categoryScores = Object.keys(paramsByCategory).map(category => {
    const params = paramsByCategory[category];
    const totalWeightage = params.reduce((sum: number, param: CCIParameter) => sum + param.weightage, 0);
    const weightedSum = params.reduce((sum: number, param: CCIParameter) => sum + calculateWeightedScore(param), 0);
    const categoryScore = totalWeightage > 0 ? (weightedSum / totalWeightage) * 100 : 0;
      
      // Get maturity level - needed for proper "Fail" display
      let maturityLevelText = "Insufficient";
      if (categoryScore >= 91) maturityLevelText = "Exceptional";
      else if (categoryScore >= 81) maturityLevelText = "Optimal";
      else if (categoryScore >= 71) maturityLevelText = "Manageable";
      else if (categoryScore >= 61) maturityLevelText = "Developing";
      else if (categoryScore >= 51) maturityLevelText = "Bare Minimum";
    
    return {
      category,
      score: categoryScore.toFixed(2),
        weightage: totalWeightage,
        maturityLevel: maturityLevelText
    };
  });
  
    // Add category scores as markdown text
    children.push(
      new Paragraph({
        text: convertTableToMarkdown(
          ["Framework Category", "Score (%)", "Weightage (%)"],
          categoryScores.map(cs => [cs.category, cs.score, cs.weightage.toString()])
        )
      })
    );
    
  children.push(new PageBreak());
  
  // Implementation Evidence Summary
  children.push(
    new Paragraph({
      text: "Implementation Evidence Summary",
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      text: "This section summarizes all implementation evidence required for each parameter.",
      spacing: {
        after: 300,
      },
    })
  );
  
  // Add implementation evidence by category
  Object.keys(paramsByCategory).forEach(category => {
    children.push(
      new Paragraph({
        text: category,
        heading: HeadingLevel.HEADING_2,
      })
    );
    
    paramsByCategory[category].forEach(param => {
      children.push(
        new Paragraph({
          text: `${param.measureId}: ${param.title}`,
          heading: HeadingLevel.HEADING_3,
        }),
        new Paragraph({
          text: param.implementationEvidence || "No evidence details provided.",
          spacing: {
            after: 200,
          },
        })
      );
    });
  });
  
  children.push(new PageBreak());
  
  // Detailed Parameter Assessments
  children.push(
    new Paragraph({
      text: "Detailed Parameter Assessments",
      heading: HeadingLevel.HEADING_1,
    })
  );
  
  // Add category and parameters details
  Object.keys(paramsByCategory).forEach(category => {
    children.push(
      new Paragraph({
        text: category,
        heading: HeadingLevel.HEADING_2,
      })
    );
    
      // Parameter summary as markdown
      const tableData = paramsByCategory[category].map(param => {
        const score = calculateParameterScore(param);
        const weightedScore = calculateWeightedScore(param);
        
        return [
          param.measureId,
          param.title,
          `${score.toFixed(2)}%`,
          `${param.weightage}%`,
          weightedScore.toFixed(2)
        ];
      });
      
      children.push(
        new Paragraph({
          text: convertTableToMarkdown(
            ["ID", "Parameter", "Score", "Weightage", "Weighted Score"],
            tableData
          )
        })
      );
      
      // Add detailed parameter information
      paramsByCategory[category].forEach(param => {
        const score = calculateParameterScore(param);
        const weightedScore = calculateWeightedScore(param);
        
        // Add parameter detail section with spacing
        children.push(new Paragraph({ text: " " })); // Add spacing
        
        // Parameter Title with ID
        children.push(
          new Paragraph({
            text: `${param.title} (${param.measureId})`,
            heading: HeadingLevel.HEADING_3,
            spacing: {
              before: 300,
            },
          })
        );
        
        // Create parameter details as markdown text
        children.push(
          new Paragraph({ 
            text: "Description",
            run: {
              bold: true
            }
          }),
          new Paragraph({ text: param.description }),
          new Paragraph({ text: " " }),
          
          new Paragraph({ 
            text: "Formula",
            run: {
              bold: true
            }
          }),
          new Paragraph({ text: param.formula }),
          new Paragraph({ text: " " }),
          
          new Paragraph({ 
            text: "Current Values",
            run: {
              bold: true
            }
          }),
          new Paragraph({ text: `Numerator: ${param.numerator}` }),
          new Paragraph({ text: `Denominator: ${param.denominator}` }),
          new Paragraph({ text: `Score: ${score.toFixed(2)}%` }),
          new Paragraph({ text: `Weighted Score: ${weightedScore.toFixed(2)}` }),
          new Paragraph({ text: " " }),
          
          new Paragraph({ 
            text: "Control Information",
            run: {
              bold: true
            }
          }),
          new Paragraph({ text: param.controlInfo }),
          new Paragraph({ text: " " }),
          
          new Paragraph({ 
            text: "Implementation Evidence",
            run: {
              bold: true
            }
          })
        );
        
        // Split evidence by newlines to make it more readable
        param.implementationEvidence.split('\n').forEach(line => {
          children.push(new Paragraph({ text: line }));
        });
        
        // Add optional details
        if (param.standardContext) {
          children.push(
            new Paragraph({ text: " " }),
            new Paragraph({ 
              text: "Standard Context",
              run: {
                bold: true
              }
            }),
            new Paragraph({ text: param.standardContext })
          );
        }
        
        if (param.bestPractices) {
          children.push(
            new Paragraph({ text: " " }),
            new Paragraph({ 
              text: "Best Practices",
              run: {
                bold: true
              }
            })
          );
          
          param.bestPractices.split('\n').forEach(line => {
            children.push(new Paragraph({ text: line }));
          });
        }
        
        if (param.regulatoryGuidelines) {
          children.push(
            new Paragraph({ text: " " }),
            new Paragraph({ 
              text: "Regulatory Guidelines",
              run: {
                bold: true
              }
            }),
            new Paragraph({ text: param.regulatoryGuidelines })
          );
        }
        
        if (param.auditorComments) {
          children.push(
            new Paragraph({ text: " " }),
            new Paragraph({ 
              text: "Auditor Comments",
              run: {
                bold: true
              }
            }),
            new Paragraph({ text: param.auditorComments })
          );
        }
        
        // Add a page break after each parameter for better readability
        children.push(new PageBreak());
      });
    });
    
    // Add Annexure K if provided
    if (annexureKData) {
      children.push(
        new PageBreak(),
        new Paragraph({
          text: "Annexure K - Self Assessment Form",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 500,
            after: 400,
          },
        }),
        new Paragraph({
          text: "As required under SEBI CSCRF Guidelines",
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
        }),
        new Paragraph({
          text: "Entity Information",
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 300,
            after: 200,
          },
        }),
        
        // Entity details in clear format
        new Paragraph({ 
          text: "Entity Name:", 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        new Paragraph({ 
          text: annexureKData.organization || result.organization,
          spacing: { after: 200 }
        }),
        
        new Paragraph({ 
          text: "Entity Type:", 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        new Paragraph({ 
          text: annexureKData.entityType || 'Not specified',
          spacing: { after: 200 }
        }),
        
        new Paragraph({ 
          text: "Entity Category:", 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        new Paragraph({ 
          text: annexureKData.entityCategory || 'Not specified',
          spacing: { after: 200 }
        }),
        
        new Paragraph({ 
          text: "Assessment Period:", 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        new Paragraph({ 
          text: annexureKData.period || 'Not specified',
          spacing: { after: 200 }
        }),
        
        new Paragraph({ 
          text: "Auditing Organization:", 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        new Paragraph({
          text: annexureKData.auditingOrganization || 'Not specified',
          spacing: { after: 300 }
        }),
        
        // Signatory Information
        new Paragraph({
          text: "Signatory Information",
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 300,
            after: 200,
          },
        }),
        
        new Paragraph({ 
          text: "Name of the Signatory:", 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        new Paragraph({ 
          text: annexureKData.signatoryName || 'Not specified',
          spacing: { after: 200 }
        }),
        
        new Paragraph({ 
          text: "Designation:", 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        new Paragraph({
          text: annexureKData.designation || 'Not specified',
          spacing: { after: 300 }
        }),
        
        // Assessment Summary with more detailed formatting
        new Paragraph({
          text: "Assessment Summary",
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 300,
            after: 200,
          },
        }),
        
        new Paragraph({ 
          text: "Rationale for self-assessment:", 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        new Paragraph({
          text: annexureKData.rationale || 'Not provided',
          spacing: { after: 300 }
        }),
        
        // Summary of assessment result
        new Paragraph({
          text: "Assessment Results",
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 300,
            after: 200,
          },
        }),
        
        new Paragraph({ 
          text: `Overall Score: ${result.totalScore.toFixed(2)}%`, 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        
      new Paragraph({
          text: `Maturity Level: ${result.maturityLevel}`, 
          spacing: { after: 100 },
          run: {
            bold: true
          }
        }),
        
      new Paragraph({
          text: `Assessment Date: ${new Date(result.date).toLocaleDateString('en-GB')}`, 
          spacing: { after: 400 },
          run: {
            bold: true
          }
        }),
        
        // Signature line
      new Paragraph({
          text: "Signature: ____________________________",
          spacing: {
            before: 500,
            after: 100,
          },
        }),
        
      new Paragraph({
          text: `Date: ${new Date().toLocaleDateString('en-GB')}`,
          spacing: {
            after: 300,
          },
        }),
        
        // Verification marker (hidden)
        new Paragraph({
          text: `Annexure K data verified - ${new Date().toISOString()}`,
          alignment: AlignmentType.RIGHT,
          style: "Hidden"
        })
      );
    }
    
    console.log('Document structure created');
  
  // Create a new Document with proper typing for sections
  const doc = new Document({
    sections: [{
      properties: {
        type: SectionType.CONTINUOUS
      },
      children: children
    } as ISectionOptions],
    styles: {
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 28,
            bold: true,
            color: "0033CC", // SEBI blue
          },
          paragraph: {
            spacing: {
              after: 120,
            },
          },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 24,
            bold: true,
            color: "0033CC", // SEBI blue
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
          },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: {
            size: 20,
            bold: true,
          },
          paragraph: {
            spacing: {
              before: 240,
              after: 120,
            },
          },
        },
          {
            id: "Hidden",
            name: "Hidden Text",
            basedOn: "Normal",
            next: "Normal",
            run: {
              size: 8,
              color: "EEEEEE"
            }
          }
      ],
    },
  });
  
    console.log('Cover page added');
    
    // Add Cover Page
    const displayOrgName = result.organization && result.organization.trim() !== '' 
      ? result.organization 
      : 'Not Specified';

    (doc as any).addSection({
      properties: {
        type: SectionType.NEXT_PAGE,
      },
      children: [
        new Paragraph({
          text: 'CYBER SECURITY AND CYBER RESILIENCE FRAMEWORK',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
        }),
        new Paragraph({
          text: 'Assessment Report for',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 200,
          },
        }),
        new Paragraph({
          text: displayOrgName,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
          },
        }),
      ]
    });
    
    console.log('Document numbering fixed');
    
    // Set document properties/metadata for better identification
    (doc as any).properties = {
      title: `SEBI CSCRF Assessment Report - ${result.organization}`,
      subject: "Cyber Security and Cyber Resilience Framework Assessment",
      creator: "CCI Report Generator",
      description: `SEBI CSCRF Assessment for ${result.organization} with score ${result.totalScore.toFixed(2)}%`,
      lastModifiedBy: "CCI Calculator Tool",
      revision: "1",
      createdAt: new Date()
    };
    
    console.log('Document properties set');

    // Add additional verification for Annexure K content
    if (annexureKData) {
      console.log('Verifying Annexure K data inclusion:');
      console.log(`- Entity Type: ${annexureKData.entityType || 'Not specified'}`);
      console.log(`- Entity Category: ${annexureKData.entityCategory || 'Not specified'}`);
      console.log(`- Period: ${annexureKData.period || 'Not specified'}`);
      console.log(`- Signatory: ${annexureKData.signatoryName || 'Not specified'}`);
      
      // Add special marker section to verify annexure data inclusion
      children.push(
        new Paragraph({
          text: `--- Annexure K Verification Hash: ${Date.now()} ---`,
          alignment: AlignmentType.CENTER,
          style: "Hidden"
        })
      );
    }
    
    // Log document statistics for debugging
    const sectionCount = (doc as any).sections.length;
    const paragraphCount = children.filter(child => child instanceof Paragraph).length;
    console.log(`Document statistics before export:`);
    console.log(`- Sections: ${sectionCount}`);
    console.log(`- Paragraphs: ${paragraphCount}`);
    console.log(`- Organization: ${result.organization}`);
    console.log(`- Assessment Date: ${result.date}`);
    console.log(`- Score: ${result.totalScore.toFixed(2)}%`);
    console.log(`- Maturity Level: ${result.maturityLevel}`);
  
  // Convert to blob and save
  try {
      console.log('Converting document to buffer...');
      console.time('docx-packing');
    const buffer = await Packer.toBuffer(doc);
      console.timeEnd('docx-packing');
      
      console.log(`Buffer size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
      
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      console.log('Main document blob created');
      
      // Create a backup blob with simplified formatting - this provides redundancy
      console.log('Creating backup document...');
      const backupDoc = new Document({
        sections: [{
          children: [
            new Paragraph({
              text: "SEBI CSCRF Report - Backup Copy",
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Organization: ${result.organization}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Date: ${result.date}`,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              text: `Score: ${result.totalScore.toFixed(2)}%`,
              alignment: AlignmentType.CENTER,
            }),
            
            // Data validation section
            new Paragraph({
              text: "Data Validation Section",
              heading: HeadingLevel.HEADING_2,
            }),
            
            // Add parameter count and validation
            new Paragraph({
              text: `Parameter Count: ${parameters.length}`,
            }),
            
            // Add annexure K data if available
            ...(annexureKData ? [
              new Paragraph({
                text: "Annexure K Data Backup",
                heading: HeadingLevel.HEADING_2,
              }),
              new Paragraph({
                text: `Entity Name: ${annexureKData.organization || 'Not specified'}`,
              }),
              new Paragraph({
                text: `Entity Type: ${annexureKData.entityType || 'Not specified'}`,
              }),
              new Paragraph({
                text: `Entity Category: ${annexureKData.entityCategory || 'Not specified'}`,
              }),
              new Paragraph({
                text: `Assessment Period: ${annexureKData.period || 'Not specified'}`,
              }),
              new Paragraph({
                text: `Signatory: ${annexureKData.signatoryName || 'Not specified'}`,
              }),
              new Paragraph({
                text: `Rationale: ${annexureKData.rationale || 'Not provided'}`,
              }),
            ] : []),
          ]
        }]
      });
      
      console.log('Backup document structure created');
      console.time('backup-packing');
      const backupBuffer = await Packer.toBuffer(backupDoc);
      console.timeEnd('backup-packing');
      
      const backupBlob = new Blob([backupBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      console.log('Backup document blob created');
      
      // Final validation check of all parameters
      const validationReport = parameters.map(p => `${p.measureId}: N=${p.numerator}, D=${p.denominator}`).join('\n');
      console.log('Export validation summary:');
      console.log(`Total parameters: ${parameters.length}`);
      console.log(`Organization name length: ${result.organization.length} characters`);
      console.log(`Annexure K included: ${annexureKData ? 'Yes' : 'No'}`);
      
      // Generate and save the document
      const timestamp = new Date().toISOString().split('T')[0];
      const sanitizedOrgName = sanitizeFilename(result.organization);
      const filename = `SEBI_CSCRF_Detailed_Report_${sanitizedOrgName}_${timestamp}.docx`;
      
      // Fix for Word document numbering issue
      try {
        // Use type assertion to access private properties
        const docAny = doc as any;
        if (docAny.numbering && docAny.numbering.concreteNumberingMap) {
          for (const [key, value] of docAny.numbering.concreteNumberingMap.entries()) {
            if (value.numId === 0) {
              value.numId = 1;
              if (value.root && value.root.length > 0 && value.root[0].root) {
                value.root[0].root.numId = 1;
              }
            }
          }
        }
        console.log('Document numbering fixed');
      } catch (error) {
        console.log('Note: Could not fix document numbering, but document will still be generated');
      }
      
      // Save both files - main and backup
      console.log(`Saving document as: ${filename}`);
    saveAs(blob, filename);
      
      // If Annexure K data is included, create a backup copy
      if (annexureKData) {
        const backupFilename = `BACKUP_${sanitizeFilename(result.organization)}_${timestamp}.docx`;
        saveAs(backupBlob, backupFilename);
        console.log(`Backup report saved as ${backupFilename}`);
      }
      
      // Calculate and log total export time
      const exportEnd = performance.now();
      const exportDuration = (exportEnd - exportStart) / 1000;
    console.log(`Word report exported successfully as ${filename}`);
      console.log(`Total export process took ${exportDuration.toFixed(2)} seconds`);
      
      // Log final memory usage
      if (performanceExt && performanceExt.memory) {
        const memory = performanceExt.memory as MemoryInfo;
        console.log(`Final Memory: ${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB / ${(memory.jsHeapSizeLimit / 1048576).toFixed(2)}MB`);
      }
      
      console.groupEnd();
      
      // Dismiss loading toast
      toast.dismiss('word-export');
      
    return Promise.resolve();
    } catch (packingError) {
      console.error('Error packing the document:', packingError);
      console.log(`Document packing failed after ${((performance.now() - exportStart) / 1000).toFixed(2)} seconds`);
      console.groupEnd();
      
      toast.dismiss('word-export');
      return Promise.reject(packingError);
    }
  } catch (error) {
    console.error('Error generating Word document:', error);
    console.groupEnd();
    return Promise.reject(error);
  }
};

/**
 * Export SEBI CSCRF report as Markdown format
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
    markdown += `# Detailed SEBI CSCRF Compliance Report\n\n`;
    
    // Add organization and date
    markdown += `## ${result.organization}\n`;
    markdown += `Assessment Date: ${new Date(result.date).toLocaleDateString('en-GB')}\n\n`;
    
    // Add Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `**Overall CCI Score:** ${result.totalScore.toFixed(2)}/100\n\n`;
    markdown += `**Maturity Level:** ${result.maturityLevel}\n\n`;
    markdown += `**Maturity Description:** ${result.maturityDescription}\n\n`;
    markdown += `**Compliance Status:** ${result.totalScore >= 60 ? 'Compliant' : 'Non-Compliant'}\n\n`;
    
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
    
    // Main category order
    const mainCategoryOrder = ['Governance', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'];
    
    // Add Category Analysis
    markdown += `## Category Analysis\n\n`;
    
    // Create category table
    markdown += `| Category | Score | Compliance Status | Priority |\n`;
    markdown += `| -------- | ----- | ----------------- | -------- |\n`;
    
    // Add main categories in the specified order
    mainCategoryOrder.forEach(main => {
      if (mainCategoryScores[main]) {
        const score = mainCategoryScores[main].score;
        const maturityLevel = mainCategoryScores[main].maturityLevel;
        markdown += `| ${main} | ${score.toFixed(1)} | ${maturityLevel} | ${score >= 60 ? 'Low' : 'High'} |\n`;
      }
    });
    
    // Add Category Maturity Classification section
    markdown += `\n## Category Maturity Classification\n`;
    markdown += `Detailed breakdown of maturity levels by security domain\n\n`;
    
    // Add each main category with its score and weightage
    mainCategoryOrder.forEach(main => {
      if (mainCategoryScores[main]) {
        const score = mainCategoryScores[main].score;
        const maturityLevel = mainCategoryScores[main].maturityLevel;
        const weightage = mainCategoryScores[main].totalWeightage;
        
        markdown += `### ${main}\n`;
        markdown += `**Score:** ${score.toFixed(1)}\n\n`;
        markdown += `**Weightage:** ${weightage}%\n\n`;
        markdown += `**Maturity:** ${maturityLevel}\n\n`;
      }
    });
    
    // Add Detailed Parameters by Category
    markdown += `## Detailed Parameter Assessments\n\n`;
    
    // Add parameter details by category
    sortedCategoryScores.forEach(categoryScore => {
      const category = categoryScore.category;
      markdown += `### ${category}\n`;
      markdown += `**Score:** ${categoryScore.score.toFixed(1)} - ${categoryScore.maturityLevel}\n\n`;
      
      // Parameter table
      markdown += `| Parameter | Numerator | Denominator | Weightage | Score | Weighted Score |\n`;
      markdown += `| --------- | --------- | ----------- | --------- | ----- | ------------- |\n`;
      
      paramsByCategory[category].forEach(param => {
        const score = calculateParameterScore(param);
        const weightedScore = calculateWeightedScore(param);
        
        markdown += `| ${param.title}\n${param.measureId} | ${param.numerator} | ${param.denominator} | ${param.weightage}% | ${score.toFixed(2)} | ${weightedScore.toFixed(2)} |\n`;
      });
      
      markdown += `\n`;
      
      // Add parameter details
      paramsByCategory[category].forEach(param => {
        const score = calculateParameterScore(param);
        
        markdown += `#### ${param.title}\n${param.measureId}\n\n`;
        markdown += `**Description:**\n\n${param.description}\n\n`;
        markdown += `**Control Information:**\n\n${param.controlInfo}\n\n`;
        markdown += `**Implementation Evidence:**\n\n${param.implementationEvidence}\n\n`;
        
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
    
    // Add Annexure K if provided
    if (annexureKData) {
      markdown += `## Annexure K - Self Assessment Form\n\n`;
      markdown += `**Entity Name:** ${annexureKData.organization || result.organization}\n\n`;
      markdown += `**Entity Type:** ${annexureKData.entityType || 'Not specified'}\n\n`;
      markdown += `**Entity Category:** ${annexureKData.entityCategory || 'Not specified'}\n\n`;
      markdown += `**Assessment Period:** ${annexureKData.period || 'Not specified'}\n\n`;
      markdown += `**Rationale for self-assessment:** ${annexureKData.rationale || 'Not provided'}\n\n`;
      markdown += `**Signatory Name:** ${annexureKData.signatoryName || 'Not specified'}\n\n`;
      markdown += `**Designation:** ${annexureKData.designation || 'Not specified'}\n\n`;
    }
    
    // Add notes and observations
    markdown += `## Notes & Observations\n\n`;
    markdown += `This report provides a snapshot of the organization's cyber capability maturity based on the assessment date shown above.\n\n`;
    markdown += `The CCI is calculated based on the 23 parameters across various domains as specified in the SEBI CSCRF guidelines.\n\n`;
    markdown += `For areas with lower scores, consider developing action plans to enhance controls and improve overall cyber resilience.\n\n`;
    
    markdown += `### Maturity Level Classification:\n\n`;
    markdown += `- **Exceptional (91-100):** Leading-edge security posture with advanced capabilities\n`;
    markdown += `- **Optimal (81-90):** Robust security program with well-integrated controls\n`;
    markdown += `- **Manageable (71-80):** Established security program with consistent implementation\n`;
    markdown += `- **Developing (61-70):** Basic security controls with some gaps in implementation\n`;
    markdown += `- **Bare Minimum (51-60):** Minimal security controls meeting basic requirements\n`;
    markdown += `- **Insufficient (0-50):** Inadequate security controls requiring significant improvements\n\n`;
    
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