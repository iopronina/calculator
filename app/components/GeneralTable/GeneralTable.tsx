'use client';
import React from 'react';
import InputNumber from '../Simple/Input/InputNumber';
import InputText from '../Simple/Input/InputText';
import { SettingsType } from '@/app/models/adminDataTypes';
import { numberInputValue } from '@/app/utils/functions';

interface GeneralTableProps {
    settings: SettingsType;
    userName?: string;
    onChange: (
        patch: Partial<{
            rate: number;
            overheads: number;
            profit: number;
            organizationName: string;
            organizationInfo: string;
        }>,
    ) => void;
}

const ORG_NAME_MAX_LENGTH = 200;
const ORG_INFO_MAX_LENGTH = 1000;

const GeneralTable = (props: GeneralTableProps) => {
    const handleChangeRate = (value: string) => {
        props.onChange({
            rate: Number(numberInputValue(value.toString()) || '0'),
        });
    };

    const handleChangeOverheads = (value: string) => {
        props.onChange({
            overheads: Number(numberInputValue(value.toString()) || '0'),
        });
    };

    const handleChangeProfit = (value: string) => {
        props.onChange({
            profit: Number(numberInputValue(value.toString()) || '0'),
        });
    };

    const handleChangeOrganizationName = (value: string) => {
        props.onChange({ organizationName: value });
    };

    const handleChangeOrganizationInfo = (
        event: React.ChangeEvent<HTMLTextAreaElement>,
    ) => {
        props.onChange({ organizationInfo: event.target.value });
    };

    const organizationName = props.settings.general.organizationName ?? '';
    const organizationInfo = props.settings.general.organizationInfo ?? '';
    const namePlaceholder = props.userName
        ? props.userName
        : 'Название организации';

    return (
        <div className='w-full md:w-xl flex flex-col gap-6'>
            <table className='border-collapse w-full border-spacing-0 table-auto'>
                <tbody>
                    <tr>
                        <td>Коэффициент</td>
                        <td>
                            <InputNumber
                                type={'number'}
                                size={32}
                                value={props.settings.general.rate.toString()}
                                onChange={handleChangeRate}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Накладные расходы</td>
                        <td>
                            <InputNumber
                                type={'number'}
                                size={32}
                                value={props.settings.general.overheads.toString()}
                                onChange={handleChangeOverheads}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td>Сметная прибыль</td>
                        <td>
                            <InputNumber
                                type={'number'}
                                size={32}
                                value={props.settings.general.profit.toString()}
                                onChange={handleChangeProfit}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className='flex flex-col gap-4'>
                <h3 className='text-base font-semibold text-slate-900'>
                    Информация об организации в PDF
                </h3>
                <p className='text-sm text-slate-500'>
                    Если поля пустые, в PDF используется блок по умолчанию.
                </p>

                <div className='flex flex-col gap-2'>
                    <label className='text-xs uppercase tracking-wide text-slate-500'>
                        Название организации
                    </label>
                    <InputText
                        type='text'
                        size={32}
                        placeholder={namePlaceholder}
                        value={organizationName}
                        onChange={handleChangeOrganizationName}
                        maxLength={ORG_NAME_MAX_LENGTH}
                    />
                </div>

                <div className='flex flex-col gap-2'>
                    <label className='text-xs uppercase tracking-wide text-slate-500'>
                        Информация (телефон, email, ИНН/КПП)
                    </label>
                    <textarea
                        className='input input_size_32 w-full min-h-28 py-2'
                        placeholder='Телефон: ...&#10;Email: ...&#10;ИНН ... КПП ...'
                        value={organizationInfo}
                        onChange={handleChangeOrganizationInfo}
                        maxLength={ORG_INFO_MAX_LENGTH}
                    />
                    <span className='text-xs text-slate-400'>
                        {organizationInfo.length}/{ORG_INFO_MAX_LENGTH}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default GeneralTable;
