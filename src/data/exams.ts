export type ResultGuideCategory = "jamb" | "waec" | "neco" | "general";

export interface ResultGuideSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface ResultGuideLink {
  label: string;
  href: string;
  description?: string;
}

export interface ResultGuide {
  slug: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
  metaDescription: string;
  category: ResultGuideCategory;
  examBody: string;
  primarySource?: string;
  lastVerified?: string;
  steps?: string[];
  officialLinks: ResultGuideLink[];
  sections: ResultGuideSection[];
  faq?: Array<{ question: string; answer: string }>;
  tips?: string[];
}

export const DEFAULT_RESULT_LAST_VERIFIED = "2025-02-09T09:00:00+01:00";

export const resultGuides: ResultGuide[] = [
  {
    slug: "check-jamb-result-2025",
    title: "How to Check 2025 JAMB UTME Results (Official Links)",
    heroTitle: "Check Your 2025 JAMB Result",
    heroDescription:
      "Use the JAMB e-Facility portal or official SMS shortcode to view your UTME score safely.",
    metaDescription:
      "Step-by-step process for checking 2025 JAMB UTME results using the official e-Facility portal and result checker.",
    category: "jamb",
    examBody: "Joint Admissions and Matriculation Board (JAMB)",
    primarySource: "JAMB e-Facility Portal",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Visit https://www.jamb.gov.ng/efacility and sign in with your registered email",
      "Select 'Print Result Slip' or 'Check UTME Result'",
      "Enter your registration number and choose the examination year",
      "View, download, or print your score report"
    ],
    officialLinks: [
      { label: "JAMB e-Facility Portal", href: "https://www.jamb.gov.ng/efacility" },
      { label: "JAMB Support Ticketing", href: "https://support.jamb.gov.ng" }
    ],
    sections: [
      {
        heading: "Requirements Before You Start",
        body:
          "Keep your JAMB registration number and the password you used during UTME registration. If you reset your password, confirm the new one via email before logging in."
      },
      {
        heading: "Printing Your Result Slip",
        body:
          "The reprint service requires a small fee payable on the portal. After payment, use the 'Print Result Slip' option and download the PDF for your records."
      }
    ],
    faq: [
      {
        question: "Can I check my result without visiting a CBT center?",
        answer:
          "Yes. You can access the portal from any internet-enabled device. For official printouts, use cybercafés approved by JAMB if you prefer assisted service."
      }
    ],
    tips: [
      "Always log out of shared computers to protect your profile",
      "If the portal is slow, try again late at night or early morning"
    ]
  },
  {
    slug: "jamb-caps-admission-status",
    title: "JAMB CAPS: Check Admission Status – Step by Step",
    heroTitle: "Use JAMB CAPS for Admission Updates",
    heroDescription:
      "Monitor offers from universities and polytechnics on the Central Admissions Processing System (CAPS).",
    metaDescription:
      "Guide to checking and accepting admission offers on JAMB CAPS, including tips for refreshing your profile.",
    category: "jamb",
    examBody: "Joint Admissions and Matriculation Board (JAMB)",
    primarySource: "JAMB Central Admissions Processing System (CAPS)",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Sign into the JAMB e-Facility portal and open the CAPS dashboard",
      "Switch to desktop site mode on mobile browsers for the full menu",
      "Click 'Admission Status' to see current offers",
      "Accept or reject the offer and print the confirmation"
    ],
    officialLinks: [
      { label: "JAMB CAPS", href: "https://www.jamb.gov.ng/efacility" },
      { label: "CAPS User Guide", href: "https://caps.jamb.gov.ng" }
    ],
    sections: [
      {
        heading: "What the Status Messages Mean",
        body:
          "'Not Admitted' means institutions have not yet offered you a place. 'Admission in Progress' signals ongoing consideration. Once it changes to 'Admitted', respond immediately."
      },
      {
        heading: "O'Level Upload Reminder",
        body:
          "Ensure your O'Level results are uploaded at an accredited CBT center. CAPS may not process your admission without verified results."
      }
    ],
    tips: [
      "Use Chrome or Firefox desktop mode for CAPS on mobile",
      "Accept or reject offers within 72 hours to avoid forfeiting"
    ]
  },
  {
    slug: "print-jamb-result-slip",
    title: "How to Print JAMB Result Slip Online",
    heroTitle: "Print Your JAMB Result Slip",
    heroDescription:
      "Download an official JAMB result slip with passport photo for admission screening exercises.",
    metaDescription:
      "Instructions for paying and printing an official JAMB result slip online, including acceptable payment channels.",
    category: "jamb",
    examBody: "Joint Admissions and Matriculation Board (JAMB)",
    primarySource: "JAMB Result Slip Printing Service",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Login to the JAMB e-Facility portal",
      "Select 'Print Result Slip' and click 'Continue to Payment'",
      "Pay using Remita, card, or bank transfer",
      "Return to the portal to download your PDF slip"
    ],
    officialLinks: [
      { label: "Print Result Slip", href: "https://www.jamb.gov.ng/efacility" },
      { label: "Remita Payment", href: "https://remita.net" }
    ],
    sections: [
      {
        heading: "Accepted Payment Methods",
        body:
          "You can pay online via debit card, USSD, or bank transfer. Keep the Remita Retrieval Reference (RRR) safe in case you need customer support."
      },
      {
        heading: "Printing Tips",
        body:
          "Use color printers when possible because institutions prefer slips that display your photograph clearly."
      }
    ],
    tips: [
      "If your payment fails, wait a few minutes before retrying to avoid double charges",
      "Download and store the PDF on cloud storage for backup"
    ]
  },
  {
    slug: "waec-result-checker",
    title: "WAEC Result Checker (Nigeria) – e-PIN Guide",
    heroTitle: "Check Your WAEC Result",
    heroDescription:
      "Enter your WAEC examination number and e-PIN on the official WAEC Direct portal to see your grades.",
    metaDescription:
      "Guide to buying a WAEC e-PIN and checking SSCE results on waecdirect.org, with error troubleshooting tips.",
    category: "waec",
    examBody: "West African Examinations Council (WAEC)",
    primarySource: "WAEC Direct Result Checker",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Purchase a WAEC Direct e-PIN from authorized vendors or WAEC offices",
      "Visit https://www.waecdirect.org",
      "Enter your 10-digit examination number and e-PIN",
      "Select examination year and type, then click 'Submit'"
    ],
    officialLinks: [
      { label: "WAEC Direct", href: "https://www.waecdirect.org" },
      { label: "Buy WAEC e-PIN", href: "https://waecdirect.org/epin" }
    ],
    sections: [
      {
        heading: "Where to Buy the e-PIN",
        body:
          "Purchase from WAEC offices, authorized banks, or trusted online vendors. Avoid sharing your PIN with agents after use."
      },
      {
        heading: "Number of Checks",
        body:
          "Each e-PIN allows five result checks. Keep a record of your first retrieval in case you need to revisit the portal later."
      }
    ],
    tips: [
      "Ensure your browser has pop-ups enabled to view printable result format",
      "If you misplace your PIN, contact WAEC support with proof of purchase"
    ]
  },
  {
    slug: "waec-results-verification",
    title: "WAEC Results Verification – For Schools & Employers",
    heroTitle: "Verify WAEC Results Officially",
    heroDescription:
      "Institutions can authenticate WAEC results using the WAEC verification portal or dedicated scratch cards.",
    metaDescription:
      "Instructions for schools and employers to verify WAEC results via the official verification portal and digital certificates.",
    category: "waec",
    examBody: "West African Examinations Council (WAEC)",
    primarySource: "WAEC Results Verification Service",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Create an account on the WAEC verification portal",
      "Purchase verification units based on the number of candidates",
      "Enter candidate examination details or upload a batch file",
      "Download verification reports for record keeping"
    ],
    officialLinks: [
      { label: "WAEC Verification Portal", href: "https://verification.waecdirect.org" },
      { label: "WAEC Nigeria", href: "https://www.waecnigeria.org" }
    ],
    sections: [
      {
        heading: "Digital Certificate Service",
        body:
          "WAEC now issues digital certificates that candidates can share securely with institutions. Request the candidate's shareable link for faster verification."
      },
      {
        heading: "Bulk Verification",
        body:
          "Upload CSV files when verifying many candidates at once. Ensure data formatting follows WAEC guidelines to avoid errors."
      }
    ],
    tips: [
      "Use corporate email addresses when creating verification profiles",
      "Maintain confidentiality of candidate data in compliance with privacy laws"
    ]
  },
  {
    slug: "neco-result-checker",
    title: "NECO Result Checker – Official Portal (2025)",
    heroTitle: "Check Your NECO Result",
    heroDescription:
      "Purchase a NECO result token and enter it on the official results portal to view your scores.",
    metaDescription:
      "How to purchase NECO result tokens and check 2025 SSCE results on results.neco.gov.ng with troubleshooting tips.",
    category: "neco",
    examBody: "National Examinations Council (NECO)",
    primarySource: "NECO Results Portal",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Buy a NECO result token from the official portal or accredited agents",
      "Visit https://results.neco.gov.ng",
      "Enter your exam year, type, registration number, and token",
      "Click 'Check Result' to display your grades"
    ],
    officialLinks: [
      { label: "NECO Results Portal", href: "https://results.neco.gov.ng" },
      { label: "Buy NECO Token", href: "https://result.neco.gov.ng/token" }
    ],
    sections: [
      {
        heading: "Token Security",
        body:
          "Treat your token like a password. Do not share it with cybercafés after use and keep the purchase receipt for verification."
      },
      {
        heading: "Number of Views",
        body:
          "A single token supports multiple result checks for the same candidate, so you can log in later to print copies without extra fees."
      }
    ],
    tips: [
      "Use modern browsers (Chrome, Edge, Firefox) for the best experience",
      "If the portal returns an error, clear your cache and retry"
    ]
  },
  {
    slug: "neco-e-verify",
    title: "NECO e-Verify – Confirm a Candidate’s Result",
    heroTitle: "NECO e-Verify Service",
    heroDescription:
      "Employers and institutions can authenticate NECO results using the e-Verify portal and candidate tokens.",
    metaDescription:
      "Guide for institutions to verify NECO results using the e-Verify portal, including payment and report download steps.",
    category: "neco",
    examBody: "National Examinations Council (NECO)",
    primarySource: "NECO e-Verify Portal",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Register as an institution on verify.neco.gov.ng",
      "Purchase verification credits",
      "Enter the candidate's token and registration number",
      "Download the verification report for your records"
    ],
    officialLinks: [
      { label: "NECO e-Verify", href: "https://verify.neco.gov.ng" },
      { label: "NECO Corporate Website", href: "https://www.neco.gov.ng" }
    ],
    sections: [
      {
        heading: "Why Use e-Verify",
        body:
          "The e-Verify platform provides tamper-proof confirmation of grades, protecting institutions from forged certificates."
      },
      {
        heading: "Batch Processing",
        body:
          "Upload spreadsheets to verify multiple candidates. Confirm that each token matches the candidate to avoid failed reports."
      }
    ],
    tips: [
      "Assign verification rights to designated HR officers only",
      "Archive PDF reports in secure document management systems"
    ]
  },
  {
    slug: "jamb-result-by-sms",
    title: "JAMB Result by SMS – Format and Fees",
    heroTitle: "Check JAMB Result via SMS",
    heroDescription:
      "Send an SMS with your JAMB registration number using the approved format to receive your UTME score.",
    metaDescription:
      "Official JAMB SMS result checking format, network fees, and troubleshooting common errors for Nigerian candidates.",
    category: "jamb",
    examBody: "Joint Admissions and Matriculation Board (JAMB)",
    primarySource: "JAMB SMS Result Checking Service",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Open the messaging app on the phone number used during JAMB registration",
      "Type RESULT and send to 55019 or 66019",
      "Wait for a confirmation SMS containing your UTME score",
      "If you receive an error, resend after resolving the highlighted issue"
    ],
    officialLinks: [
      { label: "JAMB SMS Announcement", href: "https://www.jamb.gov.ng" }
    ],
    sections: [
      {
        heading: "SMS Charges",
        body:
          "Each SMS costs ₦50. Ensure your line has enough airtime before sending the request."
      },
      {
        heading: "Common Error Codes",
        body:
          "'No record found' means results are not yet ready or you used an unregistered number. 'Insufficient balance' requires topping up before retrying."
      }
    ],
    tips: [
      "Keep the SMS as proof until you access the portal",
      "Do not share the response SMS publicly because it contains personal scores"
    ]
  },
  {
    slug: "waec-common-errors",
    title: "Common WAEC Errors (Wrong PIN/Serial) – Fixes",
    heroTitle: "Fix Common WAEC Result Errors",
    heroDescription:
      "Resolve WAEC result checker issues such as invalid PIN, incorrect serial number, or exceeded checks.",
    metaDescription:
      "Troubleshooting guide for WAEC result checker errors including invalid PIN, wrong details, and exceeded usage limits.",
    category: "waec",
    examBody: "West African Examinations Council (WAEC)",
    primarySource: "WAEC Direct Support Notices",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Confirm that the e-PIN and serial number match the card you purchased",
      "Verify the examination year and candidate number",
      "If the portal says 'result not available', wait for official release notices",
      "Contact WAEC support with your scratch card receipt if issues persist"
    ],
    officialLinks: [
      { label: "WAEC Support", href: "https://support.waecdirect.org" }
    ],
    sections: [
      {
        heading: "Exceeded Maximum Checks",
        body:
          "Each card allows only five result checks. If exhausted, purchase a new e-PIN and retry."
      },
      {
        heading: "Serial Number Tips",
        body:
          "Enter the serial number exactly as printed, avoiding spaces or lowercase-to-uppercase mistakes."
      }
    ],
    tips: [
      "Take a clear photo of your scratch card immediately after purchase",
      "Always confirm transaction receipts from vendors"
    ]
  },
  {
    slug: "neco-token-guide",
    title: "NECO Token: Where to Get and How to Use It",
    heroTitle: "Buy and Use NECO Tokens",
    heroDescription:
      "Understand the NECO token purchase process and how to use it for result checking or verification.",
    metaDescription:
      "Where to buy NECO tokens, how to apply them on the results portal, and tips for keeping them secure.",
    category: "neco",
    examBody: "National Examinations Council (NECO)",
    primarySource: "NECO Token Purchase Portal",
    lastVerified: DEFAULT_RESULT_LAST_VERIFIED,
    steps: [
      "Create an account on result.neco.gov.ng/token",
      "Purchase tokens using debit card, bank transfer, or USSD",
      "Assign the token to a candidate profile",
      "Use the token on the results portal or share with institutions for verification"
    ],
    officialLinks: [
      { label: "NECO Token Portal", href: "https://result.neco.gov.ng/token" },
      { label: "NECO Support", href: "https://www.neco.gov.ng/contact" }
    ],
    sections: [
      {
        heading: "Token Validity",
        body:
          "Tokens remain valid until they are used for the assigned candidate. You can reuse the same token multiple times for that candidate."
      },
      {
        heading: "Protecting Your Token",
        body:
          "Do not send tokens through unsecured messaging apps. Share them via email only with trusted institutions and revoke access if compromised."
      }
    ],
    tips: [
      "Keep payment confirmation emails for reference",
      "Assign tokens immediately after purchase to avoid mix-ups"
    ]
  }
];
