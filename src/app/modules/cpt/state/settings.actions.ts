
export class SettingsButtonClicked {
    static readonly type = '[Settings] Open Settings Button Clicked';
    constructor() { }
}

export class SettingsFetch {
    static readonly type = '[Settings] Fetch All';
}

export class SettingsFetchUser {
    static readonly type = '[Settings] Fetch User Settings';
}

export class SettingsFetchBackendInfo {
    static readonly type = '[Settings] Fetch Backend Info';
}

export class SettingsFetchSimulationInfo {
    static readonly type = '[Settings] Fetch Simulation Info';
}

export class SettingsVariablePrecisionUpdate {
    static readonly type = '[Settings] Variable Precision Update';
    constructor(public readonly payload: { precision: number }) { }
}

export class SettingsBreakdownVariablePrecisionUpdate {
    static readonly type = '[Settings] Breakdown Variable Precision Update';
    constructor(public readonly payload: { precision: number }) { }
}

export class SettingsTimezoneUpdate {
    static readonly type = '[Settings] Client Time Zone Update';
    constructor(public readonly payload: { timezone: string }) { }
}

export class SettingsSigmaUpdate {
    static readonly type = '[Settings] Client Sigma Update';
    constructor(public readonly payload: { sigma: number[] }) { }
}
