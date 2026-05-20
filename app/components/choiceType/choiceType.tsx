'use client';
import { useState } from 'react';
import Tab from '../Simple/Tab/Tab';
import ConcreteType from '../concreteType/concreteType';
import { SettingsType } from '@/app/models/adminDataTypes';
import { TABS } from './tabs.data';

interface ChoiceTypeProps {
    settings: SettingsType;
    userName?: string;
}

const ChoiceType = (props: ChoiceTypeProps) => {
    const [activeTab, setActiveTab] = useState<string>('concrete');

    const handleTabClick = (value: string) => {
        setActiveTab(value);
    };

    return (
        <section className='py-5 admin'>
            <div className='flex justify-between items-start gap-6 flex-col'>
                <div className='w-full flex justify-center gap-6 mb-6'>
                    {TABS.map((tab) => (
                        <Tab
                            key={tab.title}
                            className={
                                activeTab === tab.title ? 'color-primary' : ''
                            }
                            size={32}
                            activeTab={activeTab}
                            onClick={() => handleTabClick(tab.title)}
                            variant={'stroke'}
                            eventKey={tab.title}>
                            {tab.label}
                        </Tab>
                    ))}
                </div>
                {activeTab === 'concrete' && (
                    <ConcreteType
                        settings={props.settings}
                        userName={props.userName}
                    />
                )}
                {activeTab === 'polymer' && <></>}
            </div>
        </section>
    );
};

export default ChoiceType;
