import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getDb } from '@/app/utils/api-routes';
import { Db, Document } from 'mongodb';
import { SettingsType } from '@/app/models/adminDataTypes';

const ORG_NAME_MAX_LENGTH = 200;
const ORG_INFO_MAX_LENGTH = 1000;

const DEFAULT_SETTINGS: SettingsType = {
    general: {
        rate: 0,
        overheads: 0,
        profit: 0,
        organizationName: '',
        organizationInfo: '',
    },
    pay: [],
    materials: [],
    exp: [],
    version: 0,
};

const toTrimmedString = (value: unknown, maxLength: number): string => {
    if (typeof value !== 'string') {
        return '';
    }
    return value.trim().slice(0, maxLength);
};

type PriceRow = { id: string; name: string; price: number; increase: number };

const toNumberOrFallback = (value: unknown, fallback: number): number => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const updateNumericOnly = (
    currentRows: PriceRow[],
    incomingRows: unknown,
): PriceRow[] => {
    const incomingArray = Array.isArray(incomingRows) ? incomingRows : [];
    const incomingById = new Map<string, Record<string, unknown>>();

    incomingArray.forEach((row) => {
        if (!row || typeof row !== 'object') {
            return;
        }
        const item = row as Record<string, unknown>;
        incomingById.set(String(item.id ?? ''), item);
    });

    return currentRows.map((row) => {
        const incoming = incomingById.get(row.id);
        if (!incoming) {
            return row;
        }

        return {
            ...row,
            // Only numeric fields are mutable from /edit
            price: toNumberOrFallback(incoming.price, row.price),
            increase: toNumberOrFallback(incoming.increase, row.increase),
        };
    });
};

export async function GET() {
    try {
        const { db } = await getDb(clientPromise, null);
        const settings = await getSettings(db);
        return NextResponse.json({
            status: 'success',
            data: settings ?? DEFAULT_SETTINGS,
        });
    } catch {
        return NextResponse.json(
            {
                status: 'success',
                data: DEFAULT_SETTINGS,
                warnings: ['База данных недоступна, использованы настройки по умолчанию.'],
            },
            { status: 200 },
        );
    }
}

export async function PUT(req: Request) {
    try {
        const { db, reqBody } = await getDb(clientPromise, req);
        const payload = reqBody as SettingsType & { version?: number };
        const current = await getSettingsDoc(db);
        const currentVersion = Number(current?.version || 0);
        const clientVersion = Number(payload.version ?? currentVersion);

        if (current && clientVersion !== currentVersion) {
            return NextResponse.json(
                {
                    status: 'error',
                    errors: ['Конфликт версий. Обновите страницу и повторите.'],
                },
                { status: 409 },
            );
        }

        const currentPay = Array.isArray(current?.pay)
            ? (current.pay as PriceRow[])
            : [];
        const currentMaterials = Array.isArray(current?.materials)
            ? (current.materials as PriceRow[])
            : [];
        const currentExp = Array.isArray(current?.exp)
            ? (current.exp as PriceRow[])
            : [];

        if (
            currentPay.length === 0 ||
            currentMaterials.length === 0 ||
            currentExp.length === 0
        ) {
            return NextResponse.json(
                {
                    status: 'error',
                    errors: [
                        'Справочники pay/materials/exp пустые. Сначала восстановите данные миграцией.',
                    ],
                },
                { status: 400 },
            );
        }

        const now = new Date().toISOString();
        const nextVersion = currentVersion + 1;
        const currentGeneral =
            current?.general && typeof current.general === 'object'
                ? (current.general as {
                      rate?: number;
                      overheads?: number;
                      profit?: number;
                      organizationName?: string;
                      organizationInfo?: string;
                  })
                : DEFAULT_SETTINGS.general;

        const toSave: SettingsType = {
            general: {
                rate: toNumberOrFallback(payload.general?.rate, currentGeneral.rate ?? 0),
                overheads: toNumberOrFallback(
                    payload.general?.overheads,
                    DEFAULT_SETTINGS.general.overheads,
                ),
                profit: toNumberOrFallback(
                    payload.general?.profit,
                    currentGeneral.profit ?? 0,
                ),
                organizationName: toTrimmedString(
                    payload.general?.organizationName,
                    ORG_NAME_MAX_LENGTH,
                ),
                organizationInfo: toTrimmedString(
                    payload.general?.organizationInfo,
                    ORG_INFO_MAX_LENGTH,
                ),
            },
            // For tariff sections only numeric fields are mutable.
            pay: updateNumericOnly(currentPay, payload.pay),
            materials: updateNumericOnly(currentMaterials, payload.materials),
            exp: updateNumericOnly(currentExp, payload.exp),
            formula: payload.formula,
            version: nextVersion,
            updatedAt: now,
        };

        if (!isValidSettingsPayload(toSave)) {
            return NextResponse.json(
                { status: 'error', errors: ['Некорректный формат настроек.'] },
                { status: 400 },
            );
        }

        await db.collection('settings').updateOne(
            { _id: current?._id ?? 'default' },
            { $set: toSave },
            { upsert: true },
        );

        return NextResponse.json({
            status: 'success',
            data: { version: nextVersion, updatedAt: now },
            warnings: [
                'Обновлены только разрешенные числовые поля: pay/materials/exp.price+increase, general.rate+overheads+profit.',
            ],
        });
    } catch {
        return NextResponse.json(
            { status: 'error', errors: ['Ошибка сохранения настроек.'] },
            { status: 500 },
        );
    }
}

const getSettingsDoc = async (db: Db): Promise<Document | null> => {
    return db.collection('settings').findOne({});
};

const getSettings = async (db: Db): Promise<SettingsType | null> => {
    const doc = await getSettingsDoc(db);
    if (!doc) {
        return null;
    }

    const general =
        doc.general &&
        typeof doc.general.rate === 'number' &&
        typeof doc.general.overheads === 'number' &&
        typeof doc.general.profit === 'number'
            ? {
                  rate: doc.general.rate,
                  overheads: doc.general.overheads,
                  profit: doc.general.profit,
                  organizationName:
                      typeof doc.general.organizationName === 'string'
                          ? doc.general.organizationName
                          : '',
                  organizationInfo:
                      typeof doc.general.organizationInfo === 'string'
                          ? doc.general.organizationInfo
                          : '',
              }
            : DEFAULT_SETTINGS.general;

    return {
        general,
        pay: Array.isArray(doc.pay) ? doc.pay : DEFAULT_SETTINGS.pay,
        materials: Array.isArray(doc.materials)
            ? doc.materials
            : DEFAULT_SETTINGS.materials,
        exp: Array.isArray(doc.exp) ? doc.exp : DEFAULT_SETTINGS.exp,
        formula: doc.formula,
        version: Number(doc.version || 0),
        updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : undefined,
    };
};

const isValidSettingsPayload = (payload: SettingsType): boolean => {
    if (!payload || !payload.general) return false;
    if (!Array.isArray(payload.pay)) return false;
    if (!Array.isArray(payload.materials)) return false;
    if (!Array.isArray(payload.exp)) return false;
    return true;
};
