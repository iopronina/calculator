export interface FormulaSettings {
    cuttingStepThresholdCm: number;
    cuttingStepSmallM: number;
    cuttingStepLargeM: number;
    guidesAreaThreshold: number;
    guidesAreaFactor: number;
    filmOverlapCoef: number;
    concreteReserveCoef: number;
    meshOverlap100Coef: number;
    meshOverlap150Coef: number;
    meshOverlap200Coef: number;
    sealerConsumptionLpm2: number;
    jointSealantCoef: number;
    pumpAreaPerShift: number;
}

export interface SettingsType {
    general: {
        rate: number;
        overheads: number;
        profit: number;
        organizationName?: string;
        organizationInfo?: string;
    };
    exp: Array<{ id: string; name: string; price: number; increase: number }>;
    pay: Array<{ id: string; name: string; price: number; increase: number }>;
    materials: Array<{
        id: string;
        name: string;
        price: number;
        increase: number;
    }>;
    formula?: FormulaSettings;
    version?: number;
    updatedAt?: string;
}
