//isr
import ChoiceType from '../components/choiceType/choiceType';
import { SettingsType } from '@/app/models/adminDataTypes';
import { headers } from 'next/headers';
import Link from 'next/link';
import { singOutFunc } from '../actions/auth-actions';
import { auth } from '@/app/auth';

const DEFAULT_SETTINGS: SettingsType = {
    general: { rate: 0, overheads: 0, profit: 0 },
    pay: [],
    materials: [],
    exp: [],
    version: 0,
};

async function fetchSettings() {
    const fallbackMessage =
        'База данных недоступна. Используются настройки по умолчанию.';
    try {
        const hdrs = await headers();
        const protocol = hdrs.get('x-forwarded-proto') || 'http';
        const host = hdrs.get('x-forwarded-host') || hdrs.get('host');
        const dynamicBaseUrl = host ? `${protocol}://${host}` : null;
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ||
            dynamicBaseUrl ||
            'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/settings`, {
            cache: 'no-store',
        });
        if (!response.ok) {
            console.error('Error fetching settings: non-200 response');
            return { settings: DEFAULT_SETTINGS, warning: fallbackMessage };
        }
        const json: {
            status: 'success' | 'error';
            data?: SettingsType;
            errors?: string[];
            warnings?: string[];
        } = await response.json();
        console.log(json);
        if (json.status !== 'success' || !json.data) {
            console.error(
                'Error fetching settings:',
                json.errors?.join(' ') || 'Failed to fetch settings',
            );
            return { settings: DEFAULT_SETTINGS, warning: fallbackMessage };
        }

        return {
            settings: json.data,
            warning: json.warnings?.[0] || '',
        };
    } catch (error) {
        console.error('Error fetching settings:', error);
        return { settings: DEFAULT_SETTINGS, warning: fallbackMessage };
    }
}

async function EditPage() {
    const [{ settings, warning }, session] = await Promise.all([
        fetchSettings(),
        auth(),
    ]);
    const userName = session?.user?.name ?? '';

    return (
        <>
            <div className='mb-4 flex items-center justify-end gap-4'>
                <Link
                    href='/'
                    className='text-sm font-medium text-sky-700 underline underline-offset-2 hover:text-sky-800'>
                    Перейти к рассчету
                </Link>
                <form action={singOutFunc}>
                    <button
                        type='submit'
                        className='text-sm font-medium text-slate-700 underline underline-offset-2 hover:text-slate-900'>
                        Выйти
                    </button>
                </form>
            </div>
            {warning ? (
                <div className='mb-4 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800'>
                    {warning}
                </div>
            ) : null}
            {settings ? (
                <ChoiceType settings={settings} userName={userName} />
            ) : null}
        </>
    );
}

export default EditPage;
