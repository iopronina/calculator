import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import PDF from '../PDF/PDF';
import Button from '../Simple/Button/Button';
import { formatCurrency } from '@/app/utils/common';
import { SettingsType } from '@/app/models/adminDataTypes';
import {
    CalculateResponseData,
    ServiceItem,
} from '@/app/models/concreteCalcTypes';
import OfferLoader from '../Simple/OfferLoader/OfferLoader';

interface PreOfferProps {
    area: string;
    base: string;
    reinforcement: string;
    reinforcementSingleFitting: string;
    reinforcementSingleCell: string;
    reinforcementDoubleFitting: string;
    reinforcementDoubleFitting2: string;
    reinforcementDoubleCell: string;
    reinforcementGridFitting: string;
    reinforcementGridCell: string;
    reinforcementFiber: string;
    concreteGrade: string;
    microfiber: string;
    topping: string;
    toppingAmount: string;
    pump: string;
    thickness: string;
    preparation: string;
    settings: SettingsType[];
    loading: boolean;
}

type PreOfferSection = {
    key: 'works' | 'materials' | 'machines';
    title: string;
    items: ServiceItem[];
};

const PREOFFER_TABLE_COLUMNS: Array<{
    key: string;
    label: string;
    width: string;
}> = [
    { key: 'id', label: 'Арт.', width: '5%' },
    { key: 'name', label: 'Наименование', width: '35%' },
    { key: 'volume', label: 'Объем', width: '8%' },
    { key: 'unit', label: 'изм.', width: '5%' },
    { key: 'price', label: 'Стоимость, руб.', width: '14%' },
    { key: 'total', label: 'Всего', width: '15%' },
    { key: 'note', label: 'Примечание', width: '18%' },
];

const WORK_CODES = new Set([
    '0154',
    '0101',
    '0156',
    '0100',
    '0105',
    '0104',
    '0135',
    '0112',
    '0155',
    '0145',
    '0146',
    '0147',
    '0102',
    '0110',
    '0140',
    '0130',
    '0109',
    '0517',
]);

const MACHINE_CODES = new Set(['0162', '0928']);

const PdfLoadingSync = ({
    loading,
    onChange,
}: {
    loading: boolean;
    onChange: (value: boolean) => void;
}) => {
    React.useEffect(() => {
        onChange(loading);
    }, [loading, onChange]);

    return null;
};

const splitItemsToSections = (items: ServiceItem[]): PreOfferSection[] => {
    const works: ServiceItem[] = [];
    const materials: ServiceItem[] = [];
    const machines: ServiceItem[] = [];

    items.forEach((item) => {
        if (MACHINE_CODES.has(item.id)) {
            machines.push(item);
            return;
        }

        if (WORK_CODES.has(item.id)) {
            works.push(item);
            return;
        }

        materials.push(item);
    });

    const sections: PreOfferSection[] = [
        { key: 'works', title: 'Раздел 1. Работы', items: works },
        { key: 'materials', title: 'Раздел 2. Материалы', items: materials },
        {
            key: 'machines',
            title: 'Раздел 3. Эксплуатация машин и механизмов',
            items: machines,
        },
    ];

    return sections.filter((section) => section.items.length > 0);
};

const PreOffer = ({
    area,
    base,
    reinforcement,
    reinforcementSingleFitting,
    reinforcementSingleCell,
    reinforcementDoubleFitting,
    reinforcementDoubleFitting2,
    reinforcementDoubleCell,
    reinforcementGridFitting,
    reinforcementGridCell,
    reinforcementFiber,
    concreteGrade,
    microfiber,
    topping,
    toppingAmount,
    pump,
    thickness,
    preparation,
    settings,
}: PreOfferProps) => {
    const organizationName = settings?.[0]?.general?.organizationName ?? '';
    const organizationInfo = settings?.[0]?.general?.organizationInfo ?? '';
    const [isLoading, setIsLoading] = React.useState(true);
    const [isPdfLoading, setIsPdfLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<CalculateResponseData | null>(
        null,
    );
    const [calcMeta] = React.useState(() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        const rand = String(Math.floor(100 + Math.random() * 900));

        return {
            number: `${y}${m}${d}-${hh}${mm}${ss}-${rand}`,
            date: `${d}.${m}.${y}`,
            fileDate: `${y}${m}${d}-${hh}${mm}`,
        };
    });

    React.useEffect(() => {
        const runCalculation = async () => {
            setIsLoading(true);
            setIsPdfLoading(false);
            setError(null);

            try {
                const payload = {
                    area: Number(area),
                    base: (base || 'base_concrete') as
                        | 'base_concrete'
                        | 'base_sand'
                        | 'base_rubble',
                    thickness:
                        thickness && thickness !== 'auto'
                            ? Number(thickness)
                            : 'auto',
                    preparation:
                        preparation && preparation !== 'no'
                            ? Number(preparation)
                            : 'no',
                    concrete_grade: Number(concreteGrade || 1),
                    fiber:
                        microfiber && microfiber !== 'no'
                            ? Number(microfiber)
                            : 'no',
                    topping: topping === 'no' ? 'no' : 'yes',
                    topping_amount:
                        topping === 'yes' ? Number(toppingAmount || 3) : 0,
                    pump: pump === 'yes' ? 'yes' : 'no',
                    reinforcement: (reinforcement || 'doNotKnow') as
                        | 'single'
                        | 'double'
                        | 'grid'
                        | 'fiber'
                        | 'doNotKnow',
                    reinforcement_single_fitting: Number(
                        reinforcementSingleFitting || 0,
                    ),
                    reinforcement_single_cell: Number(
                        reinforcementSingleCell || 0,
                    ),
                    reinforcement_double_fitting: Number(
                        reinforcementDoubleFitting || 0,
                    ),
                    reinforcement_double_fitting2: Number(
                        reinforcementDoubleFitting2 || 0,
                    ),
                    reinforcement_double_cell: Number(
                        reinforcementDoubleCell || 0,
                    ),
                    reinforcement_grid_fitting: Number(
                        reinforcementGridFitting || 0,
                    ),
                    reinforcement_grid_cell: Number(reinforcementGridCell || 0),
                    reinforcement_fiber: Number(reinforcementFiber || 1),
                };

                const response = await fetch('/api/calculate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();

                if (!response.ok || data.status !== 'success') {
                    const message = Array.isArray(data.errors)
                        ? data.errors.join(' ')
                        : 'Ошибка выполнения расчета';
                    throw new Error(message);
                }

                setResult(data.data as CalculateResponseData);
            } catch (calcError) {
                const message =
                    calcError instanceof Error
                        ? calcError.message
                        : 'Ошибка выполнения расчета';
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        runCalculation();
    }, [
        area,
        base,
        reinforcement,
        reinforcementSingleFitting,
        reinforcementSingleCell,
        reinforcementDoubleFitting,
        reinforcementDoubleFitting2,
        reinforcementDoubleCell,
        reinforcementGridFitting,
        reinforcementGridCell,
        reinforcementFiber,
        concreteGrade,
        microfiber,
        topping,
        toppingAmount,
        pump,
        thickness,
        preparation,
    ]);

    if (isLoading) {
        return (
            <div className='text-center text-gray-500'>
                <OfferLoader />
            </div>
        );
    }

    if (error || !result) {
        return (
            <div className='max-w-7xl mx-auto bg-white rounded-sm shadow-lg p-8'>
                <div className='text-center text-red-500'>
                    {error || 'Не удалось получить результат расчета'}
                </div>
            </div>
        );
    }

    const sections = splitItemsToSections(result.section.items);

    return (
        <div className='relative'>
            {isPdfLoading ? (
                <div className='absolute inset-0 z-40 flex items-center justify-center bg-white/85 backdrop-blur-[1px]'>
                    <div className='text-center text-gray-500'>
                        <OfferLoader />
                    </div>
                </div>
            ) : null}
            <div className='max-w-7xl mx-auto bg-white rounded-sm shadow-lg'>
                <div className='mx-4 pt-4 pb-2 text-sm text-neutral-700'>
                    {result.description
                        .split('\n')
                        .filter((line) => line.trim().length > 0)
                        .map((line, index) => {
                            const isMainParam =
                                line.startsWith('Средняя толщина полов:') ||
                                line.startsWith('Общая площадь полов:');

                            if (isMainParam) {
                                return (
                                    <p
                                        key={`${line}-${index}`}
                                        className='bg-[var(--light-primary)] font-Exo2Bold text-neutral-800 px-2 py-1 my-1 inline-block'>
                                        {line}
                                    </p>
                                );
                            }

                            return <p key={`${line}-${index}`}>{line}</p>;
                        })}
                </div>
                <div className='mb-8'>
                    {sections.map((section) => {
                        const sectionTotal = section.items.reduce(
                            (sum, item) => sum + item.total,
                            0,
                        );

                        return (
                            <div key={section.key} className='mb-6'>
                                <div className='bg-slate-700 text-white px-4 py-3 font-bold rounded-t-sm'>
                                    {section.title}
                                </div>
                                <div className='overflow-x-auto'>
                                    <table className='w-full table-fixed border-collapse border border-gray-300'>
                                        <colgroup>
                                            {PREOFFER_TABLE_COLUMNS.map(
                                                (column) => (
                                                    <col
                                                        key={`${section.key}-${column.key}`}
                                                        style={{
                                                            width: column.width,
                                                        }}
                                                    />
                                                ),
                                            )}
                                        </colgroup>
                                        <thead>
                                            <tr className='bg-[var(--color-primary)] text-white'>
                                                {PREOFFER_TABLE_COLUMNS.map(
                                                    (column) => (
                                                        <th
                                                            key={`${section.key}-head-${column.key}`}
                                                            className='table-td text-left font-bold'>
                                                            {column.label}
                                                        </th>
                                                    ),
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {section.items.map(
                                                (item, index) => (
                                                    <tr
                                                        key={`${section.key}-${item.id}-${index}`}
                                                        className={
                                                            index % 2 === 0
                                                                ? 'hover:bg-gray-50'
                                                                : 'bg-gray-50 hover:bg-gray-100'
                                                        }>
                                                        <td className='table-td'>
                                                            {item.id}
                                                        </td>
                                                        <td className='table-td'>
                                                            {item.name}
                                                        </td>
                                                        <td className='table-td'>
                                                            {item.volume}
                                                        </td>
                                                        <td className='table-td'>
                                                            {item.unit}
                                                        </td>
                                                        <td className='table-td'>
                                                            {formatCurrency(
                                                                item.price,
                                                            )}
                                                        </td>
                                                        <td className='table-td'>
                                                            {formatCurrency(
                                                                item.total,
                                                            )}
                                                        </td>
                                                        <td className='table-td text-xs text-gray-600 italic'>
                                                            {item.note}
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                            <tr className='bg-[var(--light-primary)] font-bold'>
                                                <td
                                                    colSpan={5}
                                                    className='table-td'>
                                                    Итого по разделу
                                                </td>
                                                <td className='table-td'>
                                                    {formatCurrency(
                                                        sectionTotal,
                                                    )}
                                                </td>
                                                <td className='table-td'></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className='mb-8 overflow-x-auto'>
                <table className='w-full border-collapse border border-gray-300'>
                    <tbody>
                        <tr>
                            <td className='table-td'>Итого по разделам</td>
                            <td className='table-td text-right'>
                                {formatCurrency(result.totals.subtotal)}
                            </td>
                        </tr>
                        <tr>
                            <td className='table-td'>Транспортные расходы</td>
                            <td className='table-td text-right'>
                                {formatCurrency(result.totals.transport)}
                            </td>
                        </tr>
                        <tr>
                            <td className='table-td'>Прочие накладные</td>
                            <td className='table-td text-right'>
                                {formatCurrency(result.totals.overheads)}
                            </td>
                        </tr>
                        <tr>
                            <td className='table-td'>Сметная прибыль</td>
                            <td className='table-td text-right'>
                                {formatCurrency(result.totals.profit)}
                            </td>
                        </tr>
                        <tr className='font-bold bg-[var(--light-primary)]'>
                            <td className='table-td'>Итого</td>
                            <td className='table-td text-right'>
                                {formatCurrency(result.totals.grandTotal)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div className='mb-8'>
                <PDFDownloadLink
                    document={
                        <PDF
                            title={result.section.title}
                            description={result.description}
                            items={result.section.items}
                            sectionTotal={result.section.total}
                            totals={result.totals}
                            orderInfo={result.normalizedInput}
                            calcNumber={calcMeta.number}
                            calcDate={calcMeta.date}
                            organizationName={organizationName}
                            organizationInfo={organizationInfo}
                        />
                    }
                    fileName={`raschet_${calcMeta.fileDate}.pdf`}
                    className='inline-block'>
                    {({ loading: pdfLoading }) => (
                        <Button
                            className='w-full sm:w-80'
                            size={52}
                            variant='primary'
                            type='button'
                            backgroundSecondary={false}>
                            {pdfLoading ? 'Подготовка PDF...' : 'Скачать PDF'}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>
        </div>
    );
};

export default PreOffer;
