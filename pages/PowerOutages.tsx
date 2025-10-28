import React, { useState, useMemo, useEffect } from 'react';
import { PowerOutage, OutageType, SourceType } from '../types';
import { DISCOS, POWER_OUTAGES_DATA, ALL_NIGERIA_STATES, ICONS, TIPS_AND_GUIDES } from '../constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../contexts/LanguageContext';
import { formatNigerianTimeParts } from '../utils/date';

const OutageCard: React.FC<{ outage: PowerOutage }> = ({ outage }) => {
    const disCo = DISCOS.find(d => d.id === outage.disCoId);

    const getBadge = () => {
        switch (outage.type) {
            case OutageType.Planned:
                return <Badge color="blue">Planned</Badge>;
            case OutageType.Unplanned:
                return <Badge color="red">Unplanned</Badge>;
            case OutageType.Restored:
                return <Badge color="green">Restored</Badge>;
            case OutageType.Grid:
                return <Badge color="yellow">Grid Issue</Badge>;
            default:
                return <Badge color="gray">Unknown</Badge>;
        }
    };
    
    const startTime = formatNigerianTimeParts(outage.startTime);
    const restoreTime = formatNigerianTimeParts(outage.restoredTime || outage.estimatedRestoreTime);

    return (
        <Card className="mb-4">
            <CardHeader className="flex justify-between items-start">
                <div>
                    <CardTitle>{outage.affectedArea}</CardTitle>
                    <p className="text-sm text-gray-500">{disCo?.name || 'Nationwide'}</p>
                </div>
                {getBadge()}
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-700 mb-4"><span className="font-semibold">Reason:</span> {outage.reason}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="font-semibold text-gray-600">Start Time</p>
                        <p>{startTime.date} at {startTime.time}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-gray-600">{outage.type === OutageType.Restored ? 'Restored Time' : 'Est. Restore Time'}</p>
                        <p>{restoreTime.date} at {restoreTime.time}</p>
                    </div>
                     <div>
                        <p className="font-semibold text-gray-600">Source</p>
                        <div className="flex items-center">
                           <p>{outage.source}</p>
                           {outage.sourceType === SourceType.Unofficial && (
                                <span className="ml-2 text-yellow-500" title="This information is from an unverified community report and may not be accurate.">
                                    <ICONS.Warning />
                                </span>
                           )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const GuidesAndTips: React.FC = () => {
    const { texts } = useLanguage();
    const [openGuide, setOpenGuide] = useState<string | null>(null);

    const toggleGuide = (id: string) => {
        setOpenGuide(prev => (prev === id ? null : id));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{texts.guidesAndTips}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {TIPS_AND_GUIDES.map(guide => (
                        <div key={guide.id} className="border-b last:border-b-0">
                            <button
                                className="w-full text-left py-3 flex justify-between items-center hover:bg-gray-50 rounded-md px-2"
                                onClick={() => toggleGuide(guide.id)}
                                aria-expanded={openGuide === guide.id}
                                aria-controls={`guide-${guide.id}`}
                            >
                                <span className="font-semibold text-brand-green">{texts[guide.titleKey as keyof typeof texts]}</span>
                                <ICONS.ChevronRight className={`transform transition-transform duration-200 ${openGuide === guide.id ? 'rotate-90' : ''}`} />
                            </button>
                            {openGuide === guide.id && (
                                <div id={`guide-${guide.id}`} className="px-2 pb-4 text-gray-600 space-y-2">
                                    {guide.content.map((p, index) => <p key={index}>{p}</p>)}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

const PowerOutages: React.FC = () => {
    const { texts } = useLanguage();
    const [outages, setOutages] = useState<PowerOutage[]>(POWER_OUTAGES_DATA);
    const [filterDisCo, setFilterDisCo] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [filterState, setFilterState] = useState('all');
    const [filterSourceType, setFilterSourceType] = useState('all');

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate real-time updates
            setOutages(prevOutages => {
                const newOutages = [...prevOutages];
                const randomIndex = Math.floor(Math.random() * newOutages.length);
                if(newOutages[randomIndex].type === OutageType.Unplanned) {
                    const updatedOutage = {...newOutages[randomIndex], type: OutageType.Restored, restoredTime: new Date() };
                    newOutages[randomIndex] = updatedOutage;
                }
                return newOutages;
            });
        }, 120000); // every 2 minutes

        return () => clearInterval(interval);
    }, []);

    const filteredOutages = useMemo(() => {
        return outages.filter(outage => {
            const disCo = DISCOS.find(d => d.id === outage.disCoId);
            const disCoStates = disCo ? disCo.states : [];

            const disCoMatch = filterDisCo === 'all' || outage.disCoId === filterDisCo;
            const typeMatch = filterType === 'all' || outage.type === filterType;
            const stateMatch = filterState === 'all' || outage.type === OutageType.Grid || disCoStates.includes(filterState);
            const sourceTypeMatch = filterSourceType === 'all' || outage.sourceType === filterSourceType;
            
            return disCoMatch && typeMatch && stateMatch && sourceTypeMatch;
        });
    }, [outages, filterDisCo, filterType, filterState, filterSourceType]);

    const resetFilters = () => {
        setFilterDisCo('all');
        setFilterType('all');
        setFilterState('all');
        setFilterSourceType('all');
    }

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold">{texts.powerOutagesTitle}</h1>
                <p className="text-gray-600 mt-2">{texts.powerOutagesSubtitle}</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>{texts.filterOutages}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <Select label={texts.filterByState} id="state-filter" value={filterState} onChange={e => setFilterState(e.target.value)}>
                            <option value="all">All States</option>
                            {ALL_NIGERIA_STATES.sort().map(state => <option key={state} value={state}>{state}</option>)}
                        </Select>
                        <Select label={texts.filterByDisCo} id="disco-filter" value={filterDisCo} onChange={e => setFilterDisCo(e.target.value)}>
                            <option value="all">All DisCos</option>
                            {DISCOS.map(disco => <option key={disco.id} value={disco.id}>{disco.name}</option>)}
                        </Select>
                        <Select label={texts.filterByType} id="type-filter" value={filterType} onChange={e => setFilterType(e.target.value)}>
                            <option value="all">All Types</option>
                            {Object.values(OutageType).map(type => <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>)}
                        </Select>
                         <Select label={texts.filterBySource} id="source-filter" value={filterSourceType} onChange={e => setFilterSourceType(e.target.value)}>
                            <option value="all">All Sources</option>
                            <option value={SourceType.Official}>Official</option>
                            <option value={SourceType.Unofficial}>Unofficial</option>
                        </Select>
                        <Button onClick={resetFilters} variant="secondary">{texts.resetFilters}</Button>
                    </div>
                </CardContent>
            </Card>

            <GuidesAndTips />

            <div>
                <h2 className="text-2xl font-semibold mb-4">
                    {filteredOutages.length} {texts.activeIncidents}
                </h2>
                {filteredOutages.length > 0 ? (
                    filteredOutages.sort((a,b) => b.startTime.getTime() - a.startTime.getTime()).map(outage => <OutageCard key={outage.id} outage={outage} />)
                ) : (
                    <Card>
                        <CardContent className="text-center text-gray-500 py-12">
                            <p className="font-semibold text-lg">{texts.noOutagesMatch}</p>
                            <p>{texts.noOutagesMatchInfo}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default PowerOutages;