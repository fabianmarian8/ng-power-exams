import React, { useState, useEffect } from 'react';
import { ExamGuide, ExamStatus } from '../types';
import { EXAM_GUIDES_DATA } from '../constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useLanguage } from '../contexts/LanguageContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatNigerianTime } from '../utils/date';

const StatusBadge: React.FC<{ status: ExamStatus }> = ({ status }) => {
    switch (status) {
        case ExamStatus.RELEASED:
            return <Badge color="green">{status}</Badge>;
        case ExamStatus.AWAITING:
            return <Badge color="yellow">{status}</Badge>;
        case ExamStatus.ONGOING:
            return <Badge color="blue">{status}</Badge>;
        case ExamStatus.OFFLINE:
            return <Badge color="red">{status}</Badge>;
        default:
            return <Badge color="gray">{status}</Badge>;
    }
};

const ExpandedGuideContent: React.FC<{ guide: ExamGuide }> = ({ guide }) => {
    const { texts } = useLanguage();
    return (
        <div className="p-4 border-t border-gray-200">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 p-4 rounded-lg mb-6">
                <div>
                    <p className="text-sm text-gray-600">Last checked: <span className="font-semibold text-gray-800">{formatNigerianTime(guide.lastChecked)}</span></p>
                </div>
                <a href={guide.portalUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="mt-2 sm:mt-0 w-full sm:w-auto">
                        Check Result Now
                    </Button>
                </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div>
                        <h4 className="font-bold text-lg mb-2 text-brand-green">Step-by-Step Instructions</h4>
                        <ol className="list-decimal list-inside space-y-4">
                            {guide.steps.map((step, index) => (
                                <li key={index}>
                                    <span className="font-semibold">{step.title}</span>
                                    <p className="pl-6 text-gray-600">{step.details.split('`').map((part, i) =>
                                        i % 2 === 1 ? <code key={i} className="bg-gray-100 text-red-600 px-1 rounded">{part}</code> : part
                                    )}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                     {guide.smsGuide && (
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-brand-green">{texts.checkBySms}</h4>
                            <div className="bg-blue-50 p-3 rounded-md text-blue-800">
                                <p className="font-semibold">{guide.smsGuide.title}</p>
                                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                    {guide.smsGuide.steps.map((step, i) => <li key={i}>{step}</li>)}
                                </ul>
                                {guide.smsGuide.note && <p className="mt-2 text-xs italic">{guide.smsGuide.note}</p>}
                            </div>
                        </div>
                    )}
                 </div>
                 <div className="space-y-6">
                    {guide.quickLinks.length > 0 && <div>
                        <h4 className="font-bold text-lg mb-2 text-brand-green">Quick Links</h4>
                        <ul className="space-y-2">
                            {guide.quickLinks.map((link, index) => (
                                <li key={index}>
                                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline flex items-center">
                                        {link.title}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 ml-1"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>}
                     <div>
                        <h4 className="font-bold text-lg mb-2 text-brand-green">Common Issues & Solutions</h4>
                        <ul className="space-y-3">
                            {guide.commonIssues.map((issue, index) => (
                                <li key={index} className="bg-yellow-50 p-3 rounded-md">
                                    <p className="font-semibold text-yellow-800">{issue.issue}</p>
                                    <p className="text-sm text-yellow-700">{issue.solution}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                 </div>
            </div>
        </div>
    );
};

const ExamResults: React.FC = () => {
    const { texts } = useLanguage();
    const [guides, setGuides] = useState<ExamGuide[]>(EXAM_GUIDES_DATA);
    const [selectedGuide, setSelectedGuide] = useState<string | null>(null);

    useEffect(() => {
        // Simulate real-time status updates
        const interval = setInterval(() => {
            setGuides(prevGuides => {
                const newGuides = [...prevGuides];
                const randomIndex = Math.floor(Math.random() * newGuides.length);
                const statuses = Object.values(ExamStatus);
                const currentStatus = newGuides[randomIndex].status;
                let newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                // Avoid setting the same status
                while(newStatus === currentStatus) {
                    newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                }

                newGuides[randomIndex] = { ...newGuides[randomIndex], status: newStatus, lastChecked: new Date() };
                return newGuides;
            });
        }, 30000); // every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const toggleGuide = (id: string) => {
        setSelectedGuide(prev => (prev === id ? null : id));
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold">{texts.examResultsTitle}</h1>
                <p className="text-gray-600 mt-2">{texts.examResultsSubtitle}</p>
            </div>

            <div className="space-y-4">
                {guides.map(guide => (
                    <Card key={guide.id}>
                        <CardHeader 
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleGuide(guide.id)}
                            aria-expanded={selectedGuide === guide.id}
                            aria-controls={`guide-content-${guide.id}`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4">
                                       <CardTitle>{guide.acronym}</CardTitle>
                                       <StatusBadge status={guide.status} />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{guide.name}</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 transform transition-transform ${selectedGuide === guide.id ? 'rotate-90' : ''}`}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </div>
                        </CardHeader>
                        {selectedGuide === guide.id && (
                           <div id={`guide-content-${guide.id}`}>
                               <ExpandedGuideContent guide={guide} />
                           </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default ExamResults;