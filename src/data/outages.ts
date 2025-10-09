export type OutageGuideCategory = "national" | "disco" | "guide" | "resource";

export interface OutageGuideSection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface OutageGuideLink {
  label: string;
  href: string;
  description?: string;
}

export interface OutageGuideContact {
  label: string;
  value: string;
  note?: string;
}

export interface OutageGuide {
  slug: string;
  title: string;
  heroTitle: string;
  heroDescription: string;
  metaDescription: string;
  category: OutageGuideCategory;
  coverage?: string[];
  quickFacts?: string[];
  reportChannels?: OutageGuideContact[];
  officialLinks?: OutageGuideLink[];
  steps?: string[];
  sections: OutageGuideSection[];
  faq?: Array<{ question: string; answer: string }>;
}

export const outageGuides: OutageGuide[] = [
  {
    slug: "national-grid-status",
    title: "Nigeria Power Outage Today – National Grid Status",
    heroTitle: "Nigeria Power Outage Today",
    heroDescription:
      "Track the national grid status with official bulletins from the Transmission Company of Nigeria (TCN).",
    metaDescription:
      "Live Nigeria national grid outage status with links to TCN press releases, restoration updates, and customer advisories.",
    category: "national",
    quickFacts: [
      "TCN shares official press releases after grid disturbances",
      "Generation shortfalls or transmission faults trigger load shedding",
      "Regional DisCos publish local restoration timelines"
    ],
    officialLinks: [
      {
        label: "TCN Nigeria Website",
        href: "https://www.tcn.org.ng",
        description: "Official grid updates and press releases"
      },
      {
        label: "TCN on X (Twitter)",
        href: "https://twitter.com/TCN_NIGERIA",
        description: "Live alerts when national outages occur"
      },
      {
        label: "Nigerian Electricity Regulatory Commission",
        href: "https://nerc.gov.ng",
        description: "Regulatory notices on national supply"
      }
    ],
    sections: [
      {
        heading: "Current Grid Situation",
        body:
          "The Transmission Company of Nigeria coordinates load allocation to all eleven legacy DisCos and Aba Power. During nationwide outages, TCN issues situation reports on restoration efforts and affected regions. Check the latest bulletin before sharing unverified information."
      },
      {
        heading: "How to Stay Informed",
        body:
          "Follow TCN's official channels and your local DisCo for feeder-level updates. Regional WhatsApp broadcasts and SMS alerts are only reliable if they reference TCN statements.",
        bullets: [
          "Verify announcements on TCN's website or verified social accounts",
          "Listen for load shedding schedules shared via radio in your state",
          "Use your DisCo's outage portal for feeder-level restoration times"
        ]
      },
      {
        heading: "What to Do During a National Outage",
        body:
          "Switch off heavy appliances while the grid is down, keep backup power sources ventilated, and conserve battery power. Once supply is restored, wait a few minutes before powering sensitive electronics to avoid voltage spikes."
      }
    ],
    faq: [
      {
        question: "Who declares a national grid collapse?",
        answer:
          "Only the Transmission Company of Nigeria (TCN) can confirm grid collapses. DisCos relay the message to customers once they receive an official statement."
      },
      {
        question: "How long do national outages last?",
        answer:
          "Restoration times vary based on the fault. Minor frequency dips can be resolved within hours, while major transmission tower failures may take longer."
      }
    ]
  },
  {
    slug: "ikeja-electric-outage",
    title: "Ikeja Electric Outage Today (Lagos) – Feeders & Updates",
    heroTitle: "Ikeja Electric Outage Updates",
    heroDescription:
      "Check affected feeders on Ikeja Electric's Customer Notification Network (CNN) portal and get SMS alert tips.",
    metaDescription:
      "Ikeja Electric outage map for Lagos Mainland with CNN feeder lookup, reporting steps, and official customer care channels.",
    category: "disco",
    coverage: ["Agege", "Ikeja", "Ikorodu", "Abule Egba", "Shomolu"],
    reportChannels: [
      { label: "Customer Care", value: "01-700-0250" },
      { label: "24/7 Helpline", value: "0700-022-5543" },
      { label: "Email", value: "customercare@ikejaelectric.com" }
    ],
    officialLinks: [
      {
        label: "CNN Outage Portal",
        href: "https://www.ikejaelectric.com/cnn",
        description: "Search by feeder name and community"
      },
      {
        label: "Ikeja Electric Website",
        href: "https://www.ikejaelectric.com",
        description: "Newsroom, tariff updates, and service forms"
      }
    ],
    steps: [
      "Open the CNN outage portal and enter your feeder or community",
      "Confirm if the interruption is 'fault', 'planned maintenance', or 'load shedding'",
      "Report new faults via phone, WhatsApp, or the website contact form",
      "Subscribe to SMS alerts within the CNN portal for future notifications"
    ],
    sections: [
      {
        heading: "Know Your Feeder Name",
        body:
          "Your account number and prepaid meter card display the feeder serving your area. When contacting Ikeja Electric, quote the feeder to speed up fault logging."
      },
      {
        heading: "Planned Maintenance & Load Shedding",
        body:
          "Weekly schedules highlight communities experiencing load management. Planned work typically runs between 9:00 and 17:00, but voltage may fluctuate during restoration." 
      },
      {
        heading: "Escalation Steps",
        body:
          "If your area remains off after the stated restoration time, request a service ticket number from customer care and follow up with your local Undertaking office."
      }
    ]
  },
  {
    slug: "eko-disco-outage",
    title: "Eko Disco Outage Today (Lagos Island) – What’s Affected",
    heroTitle: "Eko Disco Outage Updates",
    heroDescription:
      "Lagos Island, Victoria Island, Lekki, and Ajah outage notices from Eko Electricity Distribution Company (EKEDC).",
    metaDescription:
      "Eko Disco outage today for Lagos Island with feeder list, customer care contacts, and reporting steps for EKEDC customers.",
    category: "disco",
    coverage: ["Lagos Island", "Lekki", "Victoria Island", "Apapa", "Ibeju-Lekki"],
    reportChannels: [
      { label: "24/7 Helpline", value: "0708-992-2010" },
      { label: "WhatsApp", value: "+234-708-812-5588" },
      { label: "Email", value: "customercare@ekedp.com" }
    ],
    officialLinks: [
      {
        label: "EKEDC Outage Feed",
        href: "https://www.ekedp.com/outage-updates",
        description: "Latest interruptions and restoration timelines"
      },
      {
        label: "Report a Fault",
        href: "https://www.ekedp.com/contact-us",
        description: "Phone, email, and service centers"
      }
    ],
    steps: [
      "Confirm your Business Unit (BU) and feeder from your bill or meter",
      "Check EKEDC outage feed for scheduled work affecting your area",
      "Log complaints via helpline or WhatsApp with meter number and address",
      "Follow EKEDC on verified social media for situational updates"
    ],
    sections: [
      {
        heading: "Business Units & Coverage",
        body:
          "Eko Disco operates six Business Units including Island, Lekki, Ibeju, Apapa, and Orile. Each unit provides localized outage information and escalation contacts."
      },
      {
        heading: "Marine Cable & Flood Alerts",
        body:
          "Coastal feeders suffer interruptions during heavy rains or marine cable faults. Store emergency contact numbers and unplug sensitive electronics when storms are forecast."
      }
    ]
  },
  {
    slug: "abuja-aedc-outage",
    title: "Abuja (AEDC) Outage Updates – Report via PORS App",
    heroTitle: "AEDC Power Outage Updates",
    heroDescription:
      "Use the Power Outage Reporting System (PORS) app and AEDC outage dashboards to track supply in Abuja and neighboring states.",
    metaDescription:
      "Abuja Electricity Distribution Company outage reporting via PORS app with phone numbers for FCT, Kogi, Nasarawa, and Niger.",
    category: "disco",
    coverage: ["FCT", "Niger", "Nasarawa", "Kogi"],
    reportChannels: [
      { label: "Call Center", value: "0803-907-2323" },
      { label: "PORS Mobile App", value: "Android & iOS app stores" },
      { label: "Email", value: "customerservice@abujaelectricity.com" }
    ],
    officialLinks: [
      {
        label: "PORS Web Portal",
        href: "https://pors.abujaelectricity.com",
        description: "Log outages and monitor ticket status"
      },
      {
        label: "AEDC Outage Updates",
        href: "https://www.abujaelectricity.com/category/outages",
        description: "Public announcements and planned work"
      }
    ],
    steps: [
      "Download and sign into the PORS app with your meter or account number",
      "Submit a new outage ticket, attaching photos where necessary",
      "Receive SMS/email updates when engineers are dispatched",
      "Escalate unresolved tickets with the regional customer care office"
    ],
    sections: [
      {
        heading: "District Offices",
        body:
          "AEDC operates districts in Apo, Garki, Kubwa, Wuse, and more. Customers should identify their district to receive precise restoration windows and feeder names."
      },
      {
        heading: "Load Management Notices",
        body:
          "During national generation shortages, AEDC publishes load shedding timetables. Critical infrastructure (hospitals, airports) is prioritized, while residential feeders may experience rotational outages."
      }
    ]
  },
  {
    slug: "benin-bedc-outage",
    title: "Benin (BEDC) Outage Map – Edo/Delta/Ekiti/Ondo",
    heroTitle: "BEDC Outage Alerts",
    heroDescription:
      "Get outage maps for BEDC's franchise states and learn how to contact the regional customer care teams.",
    metaDescription:
      "Benin Electricity Distribution Company outage tracker for Edo, Delta, Ekiti, and Ondo with customer care phone numbers and escalation steps.",
    category: "disco",
    coverage: ["Edo", "Delta", "Ekiti", "Ondo"],
    reportChannels: [
      { label: "Customer Care", value: "0803-901-0003" },
      { label: "WhatsApp", value: "+234-807-507-2965" },
      { label: "SMS", value: "Send 'OUT' + Account Number to 34778" }
    ],
    officialLinks: [
      {
        label: "BEDC Outage Portal",
        href: "https://www.bedcpower.com/outage",
        description: "Maps, planned maintenance, and ticket status"
      },
      {
        label: "Regional Offices",
        href: "https://www.bedcpower.com/contact",
        description: "Addresses for district escalation"
      }
    ],
    sections: [
      {
        heading: "Franchise Coverage",
        body:
          "BEDC manages over 1.3 million customers across four states. Outage dashboards are segmented by district (Benin, Asaba, Akure, and Ado-Ekiti) to provide more accurate timelines."
      },
      {
        heading: "Post-Maintenance Checks",
        body:
          "After planned shutdowns, monitor voltage stability before reconnecting large appliances. Report any sparks or noise from transformers immediately."
      }
    ]
  },
  {
    slug: "ibadan-ibedc-outage",
    title: "Ibadan Disco Outage Alerts – Oyo/Ogun/Osun/Kwara",
    heroTitle: "IBEDC Outage Alerts",
    heroDescription:
      "Track outages across IBEDC's coverage states and learn how to request feeder SMS notifications.",
    metaDescription:
      "Ibadan Electricity Distribution Company outage alerts for Oyo, Ogun, Osun, and Kwara with feeder SMS service and support contacts.",
    category: "disco",
    coverage: ["Oyo", "Ogun", "Osun", "Kwara", "parts of Niger"],
    reportChannels: [
      { label: "Call Center", value: "0700-123-9999" },
      { label: "WhatsApp", value: "+234-803-907-0001" },
      { label: "Email", value: "customercare@ibedc.com" }
    ],
    officialLinks: [
      {
        label: "IBEDC Outage Dashboard",
        href: "https://www.ibedc.com/outage-update",
        description: "Live feeder interruptions and maintenance notices"
      },
      {
        label: "Request SMS Alerts",
        href: "https://www.ibedc.com/sms-alert",
        description: "Sign up for feeder-specific notifications"
      }
    ],
    steps: [
      "Identify your Service Hub (e.g., Dugbe, Challenge, Moniya) on your bill",
      "Visit the outage dashboard for restoration timelines",
      "Enroll in SMS alerts to receive updates without calling customer care",
      "Escalate unresolved issues to the regional business hub manager"
    ],
    sections: [
      {
        heading: "Prepaid Meter Support",
        body:
          "If outages follow shortly after loading a token, verify that the meter shows 'credit available'. Power cuts unrelated to meter balance should be reported with meter serial details."
      }
    ]
  },
  {
    slug: "enugu-eedc-outage",
    title: "Enugu Disco Outage Today – Enugu/Ebonyi/Anambra/Imo/Abia",
    heroTitle: "EEDC Outage Updates",
    heroDescription:
      "Eastern Nigeria outage updates, feeder lists, and emergency contact numbers from Enugu Electricity Distribution Company.",
    metaDescription:
      "Enugu Disco outage alerts for Enugu, Ebonyi, Anambra, Imo, and Abia with customer care lines and planned maintenance.",
    category: "disco",
    coverage: ["Enugu", "Ebonyi", "Anambra", "Imo", "Abia"],
    reportChannels: [
      { label: "Call Center", value: "0815-082-0000" },
      { label: "SMS", value: "Send 'OUT' + Account Number to 0815-082-6060" },
      { label: "WhatsApp", value: "+234-818-486-1912" }
    ],
    officialLinks: [
      {
        label: "EEDC Newsroom",
        href: "https://www.enugudisco.com/media",
        description: "Press releases on feeder faults and repairs"
      },
      {
        label: "Customer Support Portal",
        href: "https://www.enugudisco.com/customer-care",
        description: "Service centers, email, and social handles"
      }
    ],
    sections: [
      {
        heading: "Community Transformers",
        body:
          "If a distribution transformer is down, collect meter numbers from affected households and submit a single ticket. EEDC prioritizes repairs with verified transformer IDs."
      }
    ]
  },
  {
    slug: "port-harcourt-phed-outage",
    title: "Port Harcourt (PHED) Outage – Rivers/Akwa Ibom/Cross River/Bayelsa",
    heroTitle: "PHED Outage Updates",
    heroDescription:
      "Monitor supply in Rivers, Akwa Ibom, Cross River, and Bayelsa via the Port Harcourt Electricity Distribution Company platform.",
    metaDescription:
      "PHED outage updates for Rivers, Akwa Ibom, Cross River, and Bayelsa with planned maintenance calendar and emergency contacts.",
    category: "disco",
    coverage: ["Rivers", "Akwa Ibom", "Cross River", "Bayelsa"],
    reportChannels: [
      { label: "Call Center", value: "0700-743-3292" },
      { label: "WhatsApp", value: "+234-803-905-1111" },
      { label: "Email", value: "customercare@phed.com" }
    ],
    officialLinks: [
      {
        label: "PHED Outage Portal",
        href: "https://phed.com.ng/outage",
        description: "View current faults and maintenance schedules"
      },
      {
        label: "Planned Maintenance Calendar",
        href: "https://phed.com.ng/planned-maintenance",
        description: "Upcoming line works and upgrades"
      }
    ],
    sections: [
      {
        heading: "High-Rainfall Preparedness",
        body:
          "Coastal feeders experience frequent faults due to storms. Ensure your premises have proper earthing and avoid touching outdoor electrical infrastructure during rainfall."
      }
    ]
  },
  {
    slug: "kano-kedco-outage",
    title: "Kano Disco Outage – Kano/Jigawa/Katsina",
    heroTitle: "KEDCO Outage Updates",
    heroDescription:
      "Northern Nigeria outage tracker for Kano Electricity Distribution Company (KEDCO) with escalation guidance.",
    metaDescription:
      "Kano Disco outage updates for Kano, Jigawa, and Katsina with customer care lines, feeder codes, and escalation steps.",
    category: "disco",
    coverage: ["Kano", "Jigawa", "Katsina"],
    reportChannels: [
      { label: "Call Center", value: "0700-555-1111" },
      { label: "WhatsApp", value: "+234-807-709-3000" },
      { label: "Email", value: "customercare@kedco.ng" }
    ],
    officialLinks: [
      {
        label: "KEDCO Website",
        href: "https://kedco.ng",
        description: "Announcements and feeder updates"
      }
    ],
    sections: [
      {
        heading: "Feeder Codes",
        body:
          "KEDCO uses alphanumeric feeder codes (e.g., KAN-33/11). Quote the correct code when logging complaints to avoid misrouting your ticket."
      }
    ]
  },
  {
    slug: "kaduna-electric-outage",
    title: "Kaduna Disco Outage – Kaduna/Kebbi/Sokoto/Zamfara",
    heroTitle: "Kaduna Electric Outage Updates",
    heroDescription:
      "Kaduna Electric service status for Kaduna, Kebbi, Sokoto, and Zamfara with direct support channels.",
    metaDescription:
      "Kaduna Electricity Distribution outage alerts covering Kaduna, Kebbi, Sokoto, and Zamfara with ticket escalation steps.",
    category: "disco",
    coverage: ["Kaduna", "Kebbi", "Sokoto", "Zamfara"],
    reportChannels: [
      { label: "Call Center", value: "0817-082-6333" },
      { label: "WhatsApp", value: "+234-803-700-0030" },
      { label: "Email", value: "customercare@kadunaelectric.com" }
    ],
    officialLinks: [
      {
        label: "Kaduna Electric Outage Feed",
        href: "https://www.kadunaelectric.com/outage-updates",
        description: "Restoration progress and transformer maintenance"
      }
    ],
    sections: [
      {
        heading: "Rural Networks",
        body:
          "Feeder spans across rural communities require right-of-way patrols. Report any downed lines immediately and keep a safe distance from damaged poles."
      }
    ]
  },
  {
    slug: "jos-jed-outage",
    title: "Jos Disco Outage – Plateau/Bauchi/Benue/Gombe",
    heroTitle: "Jos Electricity Outage Updates",
    heroDescription:
      "Jos Electricity Distribution Company (JED) outage alerts and planned interruptions across Plateau, Bauchi, Benue, and Gombe.",
    metaDescription:
      "Jos Disco outage and maintenance notices for Plateau, Bauchi, Benue, and Gombe with customer support contacts.",
    category: "disco",
    coverage: ["Plateau", "Bauchi", "Benue", "Gombe"],
    reportChannels: [
      { label: "Call Center", value: "0700-553-3227" },
      { label: "WhatsApp", value: "+234-813-432-1112" },
      { label: "Email", value: "info@jedplc.com" }
    ],
    officialLinks: [
      {
        label: "JED Plc Website",
        href: "https://www.jedplc.com",
        description: "Customer updates and service advisories"
      }
    ],
    sections: [
      {
        heading: "Planned Interruptions",
        body:
          "Distribution line upgrades and tree trimming exercises are announced at least 48 hours ahead. Monitor local radio for emergency maintenance alerts."
      }
    ]
  },
  {
    slug: "yola-yedc-outage",
    title: "Yola Disco Outage – Adamawa/Taraba/Borno/Yobe",
    heroTitle: "YEDC Outage Updates",
    heroDescription:
      "Yola Electricity Distribution Company outage information and emergency helplines for Northeast states.",
    metaDescription:
      "Yola Disco outage updates for Adamawa, Taraba, Borno, and Yobe with contact center numbers and restoration tips.",
    category: "disco",
    coverage: ["Adamawa", "Taraba", "Borno", "Yobe"],
    reportChannels: [
      { label: "Call Center", value: "0700-934-0000" },
      { label: "SMS", value: "Text 'OUT' + Meter Number to 37065" },
      { label: "Email", value: "customercare@yedcng.com" }
    ],
    officialLinks: [
      {
        label: "YEDC Website",
        href: "https://yedcng.com",
        description: "Press releases and outage alerts"
      }
    ],
    sections: [
      {
        heading: "Security Considerations",
        body:
          "Report vandalism or suspected energy theft immediately. YEDC collaborates with security agencies to secure network assets across conflict-prone areas."
      }
    ]
  },
  {
    slug: "aba-power-outage",
    title: "Aba Power Outage Updates – Abia",
    heroTitle: "Aba Power Outage Updates",
    heroDescription:
      "Dedicated outage updates for Aba Power (Geometric Power) customers across Aba and Ariaria industrial clusters.",
    metaDescription:
      "Aba Power outage notices with industrial feeder information, customer care contacts, and maintenance alerts.",
    category: "disco",
    coverage: ["Aba North", "Aba South", "Osisioma", "Ugwunagbo"],
    reportChannels: [
      { label: "Customer Desk", value: "0704-444-2222" },
      { label: "Email", value: "support@abapower.com" }
    ],
    officialLinks: [
      {
        label: "Aba Power Website",
        href: "https://abapower.com",
        description: "Outage bulletins and tariff information"
      }
    ],
    sections: [
      {
        heading: "Industrial Feeder Priority",
        body:
          "Textile, leather, and manufacturing zones have dedicated feeders. Provide the feeder label (e.g., Ariaria 11kV) when reporting outages to prioritize restoration for production clusters."
      }
    ]
  },
  {
    slug: "why-grid-collapses",
    title: "Why Nigeria’s Grid Collapses – Simple Explanation",
    heroTitle: "Why Nigeria's Grid Collapses",
    heroDescription:
      "Understand the common causes of Nigeria's national grid collapses and ongoing reforms to stabilize supply.",
    metaDescription:
      "Explanation of Nigeria's grid collapse causes, frequency, and reforms with links to TCN and NERC documentation.",
    category: "national",
    quickFacts: [
      "Grid imbalances occur when generation falls below demand",
      "Transmission faults trigger protective system shutdowns",
      "TCN and GenCos coordinate black-start restoration"
    ],
    officialLinks: [
        {
          label: "TCN Technical Reports",
          href: "https://www.tcn.org.ng/category/press-release/",
          description: "Post-event analyses and restoration updates"
        },
      {
        label: "NERC Regulatory Insights",
        href: "https://nerc.gov.ng/index.php/library/documents/industry-reports",
        description: "Studies on grid stability projects"
      }
    ],
    sections: [
      {
        heading: "Generation Shortfalls",
        body:
          "Thermal plants frequently shut down due to gas supply constraints or maintenance, reducing available megawatts. When supply dips suddenly, the grid frequency collapses if load is not shed quickly."
      },
      {
        heading: "Transmission Constraints",
        body:
          "Ageing transmission lines and substations can trip under heavy load. Protective relays isolate faults to protect equipment, but the cascading effect can cause a system-wide outage."
      },
      {
        heading: "Restoration Process",
        body:
          "Operators perform a black-start by energizing hydropower plants first, then gradually reconnecting thermal plants and load centers. This process can take several hours depending on the fault location."
      }
    ]
  },
  {
    slug: "find-feeder-name-ikeja",
    title: "How to Find Your Feeder Name (Ikeja Electric)",
    heroTitle: "Find Your Ikeja Electric Feeder",
    heroDescription:
      "Step-by-step instructions to locate your feeder name using Ikeja Electric's online tools and account documents.",
    metaDescription:
      "Guide to finding your Ikeja Electric feeder name through the CNN portal, bill statements, and prepaid meter details.",
    category: "guide",
    steps: [
      "Visit the Ikeja Electric CNN portal and select your business unit",
      "Enter your meter number or account number to display feeder information",
      "Check your physical bill for feeder and distribution substation details",
      "Save the feeder name to share during outage reports"
    ],
    sections: [
      {
        heading: "Why Feeder Names Matter",
        body:
          "Customer care agents rely on feeder names to trace faults swiftly. Sharing only your street name can slow down investigations."
      },
      {
        heading: "Alternative Sources",
        body:
          "If the portal is down, check your prepaid meter card or SMS alerts for tags such as 'Ikeja West 11kV'."
      }
    ]
  },
  {
    slug: "report-outage-aedc-pors",
    title: "How to Report a Power Outage to AEDC (PORS App)",
    heroTitle: "Report AEDC Outages via PORS",
    heroDescription:
      "Learn how to submit outage tickets using the Power Outage Reporting System (PORS) app and web portal.",
    metaDescription:
      "Seven-step guide to reporting AEDC outages with the PORS mobile app, including ticket tracking and escalation tips.",
    category: "guide",
    steps: [
      "Download the PORS app from Google Play or the iOS App Store",
      "Register with your AEDC account number and contact details",
      "Tap 'Report Outage' and fill in the feeder, address, and description",
      "Attach optional photos of the fault location",
      "Submit and note the ticket ID",
      "Track progress in the 'My Tickets' tab",
      "Escalate unresolved tickets after the indicated response window"
    ],
    sections: [
      {
        heading: "Ticket Status Codes",
        body:
          "Status updates include 'Acknowledged', 'Crew Dispatched', 'Resolved', or 'Referred'. Contact customer care if the status has not changed within the SLA."
      },
      {
        heading: "Offline Reporting",
        body:
          "If you cannot access the app, call the AEDC helpline and request manual ticket logging. Provide your meter number and phone for callbacks."
      }
    ]
  },
  {
    slug: "outage-contacts-nigeria",
    title: "Outage Contacts – All DISCO Customer Care Numbers",
    heroTitle: "Nigeria DisCo Customer Care Contacts",
    heroDescription:
      "A verified list of customer care phone numbers, WhatsApp lines, and email addresses for all Nigerian electricity DisCos.",
    metaDescription:
      "Complete Nigeria DisCo outage contact list with helplines, WhatsApp numbers, and email addresses for quick reporting.",
    category: "resource",
    sections: [
      {
        heading: "Customer Care Directory",
        body:
          "Save these helplines before an outage so you can reach your DisCo quickly."
      }
    ],
    reportChannels: [
      { label: "Ikeja Electric", value: "01-700-0250 / 0700-022-5543" },
      { label: "Eko Disco", value: "0708-992-2010 (WhatsApp: +234-708-812-5588)" },
      { label: "AEDC", value: "0803-907-2323 (PORS App support)" },
      { label: "BEDC", value: "0803-901-0003 (SMS: OUT + Account to 34778)" },
      { label: "IBEDC", value: "0700-123-9999 (WhatsApp: +234-803-907-0001)" },
      { label: "EEDC", value: "0815-082-0000 (WhatsApp: +234-818-486-1912)" },
      { label: "PHED", value: "0700-743-3292 (WhatsApp: +234-803-905-1111)" },
      { label: "KEDCO", value: "0700-555-1111 (WhatsApp: +234-807-709-3000)" },
      { label: "Kaduna Electric", value: "0817-082-6333 (WhatsApp: +234-803-700-0030)" },
      { label: "Jos Disco", value: "0700-553-3227 (WhatsApp: +234-813-432-1112)" },
      { label: "Yola Disco", value: "0700-934-0000 (SMS: OUT + Meter to 37065)" },
      { label: "Aba Power", value: "0704-444-2222 (Email: support@abapower.com)" }
    ],
    faq: [
      {
        question: "What details should I provide when calling customer care?",
        answer:
          "Share your account or meter number, feeder name, address, and a description of the issue (total outage, low voltage, flickering lights, etc.)."
      }
    ]
  },
  {
    slug: "planned-maintenance-today",
    title: "Today’s Planned Maintenance – TCN/DisCo Notices",
    heroTitle: "Today's Planned Maintenance",
    heroDescription:
      "Check scheduled maintenance from TCN and all DisCos so you can plan ahead for temporary power interruptions.",
    metaDescription:
      "Nigeria planned electricity maintenance schedule with links to TCN and DisCo notices published for the current week.",
    category: "national",
    officialLinks: [
        {
          label: "TCN Maintenance Notices",
          href: "https://www.tcn.org.ng/category/press-release/",
          description: "Daily press releases for transmission line work"
        },
      {
        label: "Ikeja Electric Planned Outage",
        href: "https://www.ikejaelectric.com/planned-outage",
        description: "Schedule for Ikeja Electric customers"
      },
      {
        label: "AEDC Maintenance Updates",
        href: "https://www.abujaelectricity.com/category/maintenance",
        description: "Weekly feeders affected across FCT, Niger, Nasarawa, and Kogi"
      }
    ],
    sections: [
      {
        heading: "Before the Scheduled Outage",
        body:
          "Charge backup power systems, store water, and disconnect appliances that do not need to restart automatically."
      },
      {
        heading: "After Maintenance",
        body:
          "Verify supply quality. If voltage remains low or your feeder is still out after the stated time, open a ticket with your DisCo referencing the maintenance notice."
      }
    ]
  },
  {
    slug: "prepaid-meter-balance",
    title: "Prepaid Meter: How to Check Balance & Buy Tokens",
    heroTitle: "Check Prepaid Meter Balance",
    heroDescription:
      "Learn the USSD codes, mobile apps, and online vendors for checking prepaid meter balance and purchasing tokens.",
    metaDescription:
      "Guide to checking prepaid electricity meter balance in Nigeria using USSD codes, smart card readers, and official online token vendors.",
    category: "resource",
    steps: [
      "Check balance directly on your meter by entering the short code (e.g., 07 on most smart meters)",
      "Use your DisCo's USSD service to view balance on your phone",
      "Purchase tokens from authorized vendors or bank apps",
      "Load the token by entering the 20-digit code on the meter keypad"
    ],
    sections: [
      {
        heading: "Popular USSD Codes",
        body:
          "IBEDC: *565*6#, Ikeja Electric: *565*25#, Eko Disco: *326#, AEDC: *946#. Dial with your registered phone number to check balance or buy units."
      },
      {
        heading: "Authorized Online Vendors",
        body:
          "Use trusted platforms such as your bank's mobile app, Remita, BuyPower, or Quickteller. Avoid sharing meter details with unverified third parties."
      }
    ]
  },
  {
    slug: "safety-during-blackouts",
    title: "Safety During Blackouts – Generators, Inverters, Fire Risk",
    heroTitle: "Safety During Blackouts",
    heroDescription:
      "Practical safety checklist covering generator use, inverter maintenance, and fire prevention during prolonged outages.",
    metaDescription:
      "Safety checklist for Nigerian homes during blackouts, including generator ventilation, inverter battery care, and fire risk reduction.",
    category: "guide",
    sections: [
      {
        heading: "Generator Safety",
        body:
          "Always run generators outdoors, at least five meters from windows. Install a carbon monoxide alarm and refuel only after the engine cools."
      },
      {
        heading: "Inverter Maintenance",
        body:
          "Keep inverter batteries in well-ventilated spaces, avoid overloading circuits, and schedule periodic health checks to prolong battery life."
      },
      {
        heading: "Fire Prevention",
        body:
          "Use surge protectors, avoid makeshift wiring, and store a functional fire extinguisher near critical equipment."
      }
    ],
    faq: [
      {
        question: "Can I run a generator overnight?",
        answer:
          "Only if it is placed outdoors with proper ventilation and fitted with a functioning automatic voltage regulator. Never run a generator in an enclosed space."
      }
    ]
  }
];
