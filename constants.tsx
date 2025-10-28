import { DisCo, PowerOutage, OutageType, ExamGuide, NewsItem, SourceType, Language, ExamStatus, TipGuide } from './types';

export const LANGUAGES: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'pcm', name: 'Nigerian Pidgin', flag: '🇳🇬' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
];

export const DISCOS: DisCo[] = [
    { id: 'ikeja', name: 'Ikeja Electric', shortName: 'IE', states: ['Lagos'], contacts: { phone: '01-448-3900', whatsapp: '+234-1-448-3900', email: 'customercare@ikejaelectric.com' } },
    { id: 'eko', name: 'Eko Disco', shortName: 'EKEDC', states: ['Lagos'], contacts: { phone: '0708-065-5555', whatsapp: '+234-708-065-5555', email: 'customercare@ekedp.com' } },
    { id: 'aedc', name: 'Abuja Electricity Distribution Company', shortName: 'AEDC', states: ['FCT', 'Kogi', 'Nasarawa', 'Niger'], contacts: { phone: '0803-907-0070', whatsapp: '+234-815-214-1414', email: 'customercare@abujaelectricity.com' } },
    { id: 'ibedc', name: 'Ibadan Electricity Distribution Company', shortName: 'IBEDC', states: ['Oyo', 'Ogun', 'Osun', 'Kwara'], contacts: { phone: '0700-123-9999', whatsapp: '+234-903-863-6555', email: 'customercare@ibedc.com' } },
    { id: 'eedc', name: 'Enugu Electricity Distribution Company', shortName: 'EEDC', states: ['Enugu', 'Imo', 'Anambra', 'Abia', 'Ebonyi'], contacts: { phone: '0812-102-0423', whatsapp: '+234-812-102-0423', email: 'customerservice@enugudisco.com' } },
    { id: 'phed', name: 'Port Harcourt Electricity Distribution Company', shortName: 'PHED', states: ['Rivers', 'Bayelsa', 'Cross River', 'Akwa Ibom'], contacts: { phone: '0700-225-57433', whatsapp: '+234-908-783-8573', email: 'customercare@phed.com.ng' } },
    { id: 'kedco', name: 'Kano Electricity Distribution Company', shortName: 'KEDCO', states: ['Kano', 'Jigawa', 'Katsina'], contacts: { phone: '0700-5533-26-24', whatsapp: '+234-815-387-5727', email: 'customercare@kedco.ng' } },
    { id: 'kaduna', name: 'Kaduna Electric', shortName: 'KAEDCO', states: ['Kaduna', 'Kebbi', 'Sokoto', 'Zamfara'], contacts: { phone: '0817-403-5711', whatsapp: '+234-817-403-5711', email: 'info@kadunaelectric.com' } },
    { id: 'jos', name: 'Jos Disco', shortName: 'JED', states: ['Plateau', 'Bauchi', 'Gombe', 'Benue'], contacts: { phone: '0706-940-3531', whatsapp: '+234-706-940-3531', email: 'info@jedplc.com' } },
    { id: 'yola', name: 'Yola Disco', shortName: 'YEDC', states: ['Adamawa', 'Borno', 'Taraba', 'Yobe'], contacts: { phone: '0903-874-2702', whatsapp: '+234-903-874-2702', email: 'complaints@yedc.com.ng' } },
    { id: 'bedc', name: 'Benin Electricity Distribution Company', shortName: 'BEDC', states: ['Edo', 'Delta', 'Ondo', 'Ekiti'], contacts: { phone: '0803-901-2323', whatsapp: '+234-803-901-2323', email: 'customercomplaints@bedcpower.com' } },
    { id: 'aba', name: 'Aba Power Limited', shortName: 'APLE', states: ['Abia'], contacts: { phone: '0815-555-5555', whatsapp: '+234-815-555-5555', email: 'support@abapower.com' } },
];

export const ALL_NIGERIA_STATES: string[] = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
    "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"
];


export const POWER_OUTAGES_DATA: PowerOutage[] = [
  { id: 'outage1', disCoId: 'ikeja', affectedArea: 'Opebi Feeder, Ikeja GRA', type: OutageType.Planned, reason: 'Scheduled maintenance on 33kV line.', startTime: new Date(Date.now() - 3600000 * 3), estimatedRestoreTime: new Date(Date.now() + 3600000 * 2), source: 'Ikeja Electric Twitter', sourceType: SourceType.Official },
  { id: 'outage2', disCoId: 'aedc', affectedArea: 'Lugbe, FCT', type: OutageType.Unplanned, reason: 'Fault on the Airport 11kV Feeder.', startTime: new Date(Date.now() - 3600000), source: 'AEDC Website', sourceType: SourceType.Official },
  { id: 'outage3', disCoId: 'phed', affectedArea: 'Rumuokoro, Port Harcourt', type: OutageType.Restored, reason: 'Emergency repairs completed.', startTime: new Date(Date.now() - 3600000 * 6), restoredTime: new Date(Date.now() - 3600000), source: 'PHED Press Release', sourceType: SourceType.Official },
  { id: 'outage4', disCoId: 'eedc', affectedArea: 'Awka, Anambra', type: OutageType.Unplanned, reason: 'Vandalism of transformer at Ifite.', startTime: new Date(Date.now() - 3600000 * 2), estimatedRestoreTime: new Date(Date.now() + 3600000 * 8), source: 'User Report (Unverified)', sourceType: SourceType.Unofficial },
  { id: 'outage5', disCoId: 'eko', affectedArea: 'Lekki Phase 1', type: OutageType.Planned, reason: 'Upgrade of substation equipment.', startTime: new Date(), estimatedRestoreTime: new Date(Date.now() + 3600000 * 5), source: 'EKEDC Telegram', sourceType: SourceType.Official },
  { id: 'outage6', disCoId: 'ibedc', affectedArea: 'Ring Road, Ibadan', type: OutageType.Unplanned, reason: 'Heavy rainfall caused a fault.', startTime: new Date(Date.now() - 3600000 * 1.5), source: 'IBEDC WhatsApp', sourceType: SourceType.Official },
  { id: 'outage7', disCoId: 'ikeja', affectedArea: 'Maryland Mall Feeder', type: OutageType.Unplanned, reason: 'Cable fault.', startTime: new Date(Date.now() - 3600000 * 4), estimatedRestoreTime: new Date(Date.now() + 3600000 * 1), source: 'Ikeja Electric Website', sourceType: SourceType.Official },
  { id: 'outage8', disCoId: 'aedc', affectedArea: 'Gwarinpa Estate, FCT', type: OutageType.Restored, reason: 'Fault cleared.', startTime: new Date(Date.now() - 3600000 * 8), restoredTime: new Date(Date.now() - 3600000 * 2), source: 'AEDC Mobile App', sourceType: SourceType.Official },
  { id: 'outage9', disCoId: 'grid', affectedArea: 'Nationwide', type: OutageType.Grid, reason: 'National Grid Collapse. System restoration in progress.', startTime: new Date(Date.now() - 3600000 * 10), source: 'TCN Statement', sourceType: SourceType.Official },
  { id: 'outage10', disCoId: 'kedco', affectedArea: 'Fagge, Kano', type: OutageType.Unplanned, reason: 'Transformer exploded, according to residents.', startTime: new Date(Date.now() - 3600000 * 0.5), source: 'Nairaland Forum (Unverified)', sourceType: SourceType.Unofficial },
];

export const EXAM_GUIDES_DATA: ExamGuide[] = [
  {
    id: 'jamb',
    name: 'Joint Admissions and Matriculation Board',
    acronym: 'JAMB',
    description: 'Check your Unified Tertiary Matriculation Examination (UTME) results and manage your admission process through the CAPS portal.',
    status: ExamStatus.AWAITING,
    lastChecked: new Date(),
    portalUrl: 'https://efacility.jamb.gov.ng/',
    quickLinks: [
        { title: 'Check Admission Status (CAPS)', url: 'https://efacility.jamb.gov.ng/CheckAdmissionsStatus' },
        { title: 'Print Original Result Slip', url: 'https://efacility.jamb.gov.ng/PrintResultSlip' },
    ],
    steps: [
      { title: 'Visit the JAMB E-facility Portal', details: 'Open your web browser and go to the official JAMB portal at `https://efacility.jamb.gov.ng/`.' },
      { title: 'Login with your Credentials', details: 'Enter the email address and password you used during your JAMB registration.' },
      { title: 'Navigate to Results Section', details: 'After logging in, find and click on the "Check UTME Results" tab or link on the dashboard.' },
      { title: 'Enter Examination Details', details: 'You may be prompted to enter your JAMB Registration Number and the examination year. Provide the correct details.' },
      { title: 'View and Print Your Result', details: 'Your result slip will be displayed on the screen. Review it carefully and use the print button to get a hard copy.' },
    ],
    commonIssues: [
        { issue: 'Result not available yet', solution: 'JAMB releases results in batches. Check back after 24-48 hours. Ensure you are checking for the correct year.' },
        { issue: 'Incorrect login details', solution: 'Use the "Forgot Password" link on the portal to reset your password if you are unsure.' },
    ],
  },
  {
    id: 'waec',
    name: 'West African Examinations Council',
    acronym: 'WAEC',
    description: 'Access your West African Senior School Certificate Examination (WASSCE) results online using a scratch card PIN.',
    status: ExamStatus.RELEASED,
    lastChecked: new Date(),
    portalUrl: 'https://www.waecdirect.org/',
    quickLinks: [
        { title: 'Buy Result Checker e-PIN', url: 'https://www.waecdirect.org/pin.aspx' },
        { title: 'Result Verification', url: 'https://www.waec.org/verification/' },
    ],
    steps: [
      { title: 'Get Your WAEC Result Checker PIN', details: 'Purchase a WAEC result checker scratch card from an authorized dealer or online. The card contains a PIN and Serial Number.' },
      { title: 'Go to the WAEC Result Checking Portal', details: 'Visit the official WAEC portal: `https://www.waecdirect.org/`.' },
      { title: 'Enter Your Information', details: 'Fill in your 10-digit Examination Number, select the Examination Year, and choose the Examination Type (e.g., School Candidate Result).' },
      { title: 'Enter Card Details', details: 'Carefully enter the Serial Number and PIN from your scratch card in the required fields.' },
      { title: 'Submit and View', details: 'Cross-check all your details and click the "Submit" button. Your result will be displayed. You have 5 uses per card.' },
    ],
    smsGuide: {
        title: "Check WAEC Result via SMS",
        steps: [
            "Compose an SMS in this format: WAEC*ExamNo*PIN*ExamYear",
            "Send the SMS to the short-code 32327 (for MTN, Glo, & Airtel subscribers).",
            "Example: WAEC*4250101001*123456789012*2024",
        ],
        note: "Note: SMS checking costs N30. Ensure you have sufficient airtime. Your result will be delivered to your phone via SMS."
    },
    commonIssues: [
        { issue: 'Error: Result not available for this candidate', solution: 'Double-check your examination number and year. It could also mean the result has been withheld pending investigation.' },
        { issue: 'Invalid PIN/Serial Number', solution: 'Scratch the card gently and enter the numbers exactly as they appear. Contact WAEC support if the problem persists.' },
    ]
  },
  {
    id: 'neco',
    name: 'National Examinations Council',
    acronym: 'NECO',
    description: 'Check your Senior School Certificate Examination (SSCE) internal or external results using a token.',
    status: ExamStatus.ONGOING,
    lastChecked: new Date(),
    portalUrl: 'https://result.neco.gov.ng/',
    quickLinks: [
        { title: 'Purchase Result Token', url: 'https://result.neco.gov.ng/purchase_token' },
    ],
    steps: [
      { title: 'Purchase a NECO Result Token', details: 'Buy a NECO result token from the official NECO portal, a bank, or an authorized agent.' },
      { title: 'Visit the NECO Results Website', details: 'Navigate to the NECO results portal at `https://result.neco.gov.ng/`.' },
      { title: 'Enter Exam and Token Details', details: 'Select your exam type (e.g., SSCE Internal), choose your exam year, and enter the token number.' },
      { title: 'Enter Your Registration Number', details: 'Type your unique NECO registration number in the provided field.' },
      { title: 'Check Your Result', details: 'Click the "Check Result" button to see your performance. Your token can be used up to 5 times.' },
    ],
    smsGuide: {
        title: "Check NECO Result via USSD/SMS",
        steps: [
            "Currently, NECO does not have a universal SMS or USSD code for result checking.",
            "Result checking is primarily done through the online portal using a token.",
            "Always refer to the official NECO website for the latest updates on result checking methods.",
        ],
        note: "Beware of fraudulent services claiming to offer NECO results via SMS."
    },
    commonIssues: [
        { issue: 'Token not found', solution: 'Ensure you have entered the token correctly. If purchased online, check your email for the correct token.' },
        { issue: 'No record for this candidate', solution: 'Verify that your registration number, exam year, and exam type are all correct.' },
    ]
  },
];

export const NEWS_DATA: NewsItem[] = [
    {id: 1, category: 'ENERGY', title: 'TCN Announces Successful Restoration of National Grid', summary: 'The Transmission Company of Nigeria (TCN) has confirmed the full restoration of the national grid following a system collapse early yesterday.', timestamp: new Date(Date.now() - 3600000 * 5)},
    {id: 2, category: 'EDUCATION', title: 'JAMB Releases Cut-off Marks for 2024 Admissions', summary: 'The Joint Admissions and Matriculation Board has announced the minimum cut-off marks for admission into universities, polytechnics, and colleges of education.', timestamp: new Date(Date.now() - 3600000 * 24)},
    {id: 3, category: 'ENERGY', title: 'NERC Approves New Electricity Tariffs for DisCos', summary: 'The Nigerian Electricity Regulatory Commission (NERC) has approved a minor review of the Multi-Year Tariff Order, affecting electricity prices nationwide.', timestamp: new Date(Date.now() - 3600000 * 48)},
    {id: 4, category: 'EDUCATION', title: 'WAEC Opens Registration for Private Candidates (GCE)', summary: 'The West African Examinations Council has officially commenced registration for the 2024 second series WASSCE for private candidates.', timestamp: new Date(Date.now() - 3600000 * 72)},
];

export const ICONS = {
    Bolt: ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>,
    BookOpen: ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>,
    ChevronRight: ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>,
    Map: ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-12.495 1.252.625a.637.637 0 0 1 .503.625V21a.637.637 0 0 1-.503.625l-1.252.625M12 3.75V21m-3.247-16.125-1.252.625a.637.637 0 0 0-.503.625V21a.637.637 0 0 0 .503.625l1.252.625" /></svg>,
    List: ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mr-2 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
    Warning: ({ className = '' }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>,
};

export const TIPS_AND_GUIDES: TipGuide[] = [
    {
        id: 'feeder-guide',
        titleKey: 'howToFindFeeder',
        content: [
            "Your 'feeder' is the main power line that supplies electricity to your area's distribution transformer. Knowing its name is crucial when reporting a specific fault.",
            "1. Check Your Bill: The feeder name is often printed on your physical electricity bill from your DisCo.",
            "2. Look at the Transformer: Some distribution transformers or the poles nearby have the feeder name stenciled on them.",
            "3. Ask Your Neighbours: Community leaders or long-term residents often know the name of the feeder serving the area.",
            "4. Call Your DisCo: When you call their customer service, they can help you identify your feeder based on your address or meter number."
        ]
    }
];