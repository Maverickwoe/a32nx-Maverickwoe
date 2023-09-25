import { useMemo, useState } from 'react';
import { Failure } from '@failures';
import { AtaChapterNumber, usePersistentProperty, useSimVar } from '@flybywiresim/fbw-sdk';
import { failureGenConfigAltitude }
    from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeFailureGeneratorUI';
import { failureGenConfigPerHour }
    from 'instruments/src/EFB/Failures/FailureGenerators/PerHourFailureGeneratorUI';
import { failureGenConfigSpeed }
    from 'instruments/src/EFB/Failures/FailureGenerators/SpeedFailureGeneratorUI';
import { failureGenConfigTakeOff }
    from 'instruments/src/EFB/Failures/FailureGenerators/TakeOffFailureGeneratorUI';
import { failureGenConfigTimer } from 'instruments/src/EFB/Failures/FailureGenerators/TimerFailureGeneratorUI';
import { ModalContextInterface, useModals } from 'instruments/src/EFB/UtilComponents/Modals/Modals';
import { selectAllFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { ArmingModeIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { EventBus } from '@microsoft/msfs-sdk';
import { useFailuresOrchestrator } from '../../failures-orchestrator-provider';

export interface FailureGenFeedbackEvent {
    expectedMode: { generatorType: string, mode: number[] };
    armingDisplayStatus: { generatorType: string, status: boolean[] };
  }

export interface FailureGenEvent {
    refreshData: boolean;
    settings: {generatorType: string, settingsString: string}
  }

export const failureGeneratorCommonFunction = () => {
    const { changingFailures, activeFailures, allFailures, activate } = useFailuresOrchestrator();

    const totalActiveFailures = useMemo(() => changingFailures.size + activeFailures.size, [changingFailures, activeFailures]);
    return { changingFailures, activeFailures, totalActiveFailures, allFailures, activate };
};

export type FailureGenData = {
    setSetting: (value: string) => void,
    settings: number[],
    numberOfSettingsPerGenerator: number,
    uniqueGenPrefix: string,
    additionalSetting: number[],
    genName: string,
    generatorSettingComponents: (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => JSX.Element[],
    alias: () => string,
    disableTakeOffRearm: boolean,
    armedState: boolean[],
    bus: EventBus,
}

export type FailureGenContext = {
    allGenSettings: Map<string, FailureGenData>,
    modals: ModalContextInterface,
    generatorFailuresGetters: Map<number, string>,
    generatorFailuresSetters: Map<number, (value: string) => void>,
    allFailures: readonly Readonly<Failure>[],
    chapters: AtaChapterNumber[],
    modalContext: ModalContext,
    setModalContext: (modalContext: ModalContext) => void,
    failureGenModalType: ModalGenType
    setFailureGenModalType: (type: ModalGenType) => void,
}

export type ModalContext = {
    failureGenData: FailureGenData,
    genNumber: number,
    genUniqueID: string,
}

export enum ModalGenType {None, Settings, Failures}

export const flatten = (settings: number[]) => {
    let settingString = '';
    for (let i = 0; i < settings.length; i++) {
        settingString += settings[i].toString();
        if (i < settings.length - 1) settingString += ',';
    }
    return settingString;
};

export enum FailurePhases {
    Dormant,
    TakeOff,
    InitialClimb,
    Flight,
}

export const basicData = () => {
    const [isOnGround] = useSimVar('SIM ON GROUND', 'Bool');
    const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
    const throttleTakeOff = useMemo(() => (maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA), [maxThrottleMode]);
    const failureFlightPhase = useMemo(() => {
        if (isOnGround) {
            if (throttleTakeOff) return FailurePhases.TakeOff;
            return FailurePhases.Dormant;
        }
        if (throttleTakeOff) return FailurePhases.InitialClimb;
        return FailurePhases.Flight;
    }, [throttleTakeOff, isOnGround]);
    return { isOnGround, maxThrottleMode, throttleTakeOff, failureFlightPhase };
};

export const failureGeneratorsSettings: () => FailureGenContext = () => {
    const modals = useModals();
    const { allFailures } = failureGeneratorCommonFunction();
    const { generatorFailuresGetters, generatorFailuresSetters } = allGeneratorFailures(allFailures);
    const allGenSettings: Map<string, FailureGenData> = new Map();
    const chapters = useMemo(() => Array.from(new Set<AtaChapterNumber>(allFailures.map((it: Failure) => it.ata))).sort((a: AtaChapterNumber, b: AtaChapterNumber) => a - b), [allFailures]);
    const [failureGenModalType, setFailureGenModalType] = useState<ModalGenType>(ModalGenType.None);
    const [modalContext, setModalContext] = useState<ModalContext | undefined >(undefined);

    allGenSettings.set(failureGenConfigAltitude().genName, failureGenConfigAltitude());
    allGenSettings.set(failureGenConfigSpeed().genName, failureGenConfigSpeed());
    allGenSettings.set(failureGenConfigPerHour().genName, failureGenConfigPerHour());
    allGenSettings.set(failureGenConfigTimer().genName, failureGenConfigTimer());
    allGenSettings.set(failureGenConfigTakeOff().genName, failureGenConfigTakeOff());

    return {
        allGenSettings,
        modals,
        generatorFailuresGetters,
        generatorFailuresSetters,
        allFailures,
        chapters,
        failureGenModalType,
        setFailureGenModalType,
        modalContext,
        setModalContext,
    };
};

export const failureGeneratorAdd = (generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    let genNumber: number;
    let didFindADisabledGen = false;
    for (let i = 0; i < generatorSettings.settings.length / generatorSettings.numberOfSettingsPerGenerator; i++) {
        if (generatorSettings.settings[i * generatorSettings.numberOfSettingsPerGenerator + ArmingModeIndex] === -1 && !didFindADisabledGen) {
            for (let j = 0; j < generatorSettings.numberOfSettingsPerGenerator; j++) {
                generatorSettings.settings[i * generatorSettings.numberOfSettingsPerGenerator + j] = generatorSettings.additionalSetting[j];
            }
            didFindADisabledGen = true;
            genNumber = i;
        }
    }
    if (didFindADisabledGen === false) {
        if (generatorSettings.settings === undefined || generatorSettings.settings.length % generatorSettings.numberOfSettingsPerGenerator !== 0 || generatorSettings.settings.length === 0) {
            generatorSettings.setSetting(flatten(generatorSettings.additionalSetting));
            genNumber = 0;
        } else {
            generatorSettings.setSetting(flatten(generatorSettings.settings.concat(generatorSettings.additionalSetting)));
            genNumber = Math.floor(generatorSettings.settings.length / generatorSettings.numberOfSettingsPerGenerator);
        }
    } else {
        generatorSettings.setSetting(flatten(generatorSettings.settings));
    }
    const genID = `${generatorSettings.uniqueGenPrefix}${genNumber}`;
    selectAllFailures(failureGenContext, genID, true);
};

export function setNewNumberOfFailureSetting(newSetting: number, generatorSettings: FailureGenData, genID: number) {
    const settings = generatorSettings.settings;
    settings[genID * generatorSettings.numberOfSettingsPerGenerator + FailuresAtOnceIndex] = newSetting;
    settings[genID * generatorSettings.numberOfSettingsPerGenerator + MaxFailuresIndex] = Math.max(settings[genID * generatorSettings.numberOfSettingsPerGenerator + MaxFailuresIndex],
        newSetting);
    generatorSettings.setSetting(flatten(settings));
}

export function setNewSetting(newSetting: number, generatorSettings: FailureGenData, genID: number, settingIndex: number) {
    const settings = generatorSettings.settings;
    settings[genID * generatorSettings.numberOfSettingsPerGenerator + settingIndex] = newSetting;
    const settingsString = flatten(settings);
    generatorSettings.setSetting(settingsString);
    sendSettings(generatorSettings.uniqueGenPrefix, settingsString, generatorSettings.bus);
}

export function sendSettings(uniqueGenPrefix: string, settingsString: string, bus: EventBus) {
    const generatorType = uniqueGenPrefix;
    console.info(`settings sent: ${generatorType} - ${settingsString}`);
    bus.getPublisher<FailureGenEvent>().pub('settings', { generatorType, settingsString }, true);
}

export const eraseGenerator: (genID: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) =>
void = (genID: number, generatorSettings: FailureGenData, _failureGenContext: FailureGenContext) => {
    const generatorNumber = generatorSettings.settings.length / generatorSettings.numberOfSettingsPerGenerator;
    if (genID === generatorNumber - 1) {
        generatorSettings.settings.splice(genID * generatorSettings.numberOfSettingsPerGenerator, generatorSettings.numberOfSettingsPerGenerator);
        generatorSettings.setSetting(flatten(generatorSettings.settings));
    } else {
        generatorSettings.settings[genID * generatorSettings.numberOfSettingsPerGenerator + ArmingModeIndex] = -1;
        generatorSettings.setSetting(flatten(generatorSettings.settings));
    }
};

export const allGeneratorFailures = (allFailures: readonly Readonly<Failure>[]) => {
    const generatorFailuresGetters: Map<number, string> = new Map();
    const generatorFailuresSetters: Map<number, (value: string) => void> = new Map();
    if (allFailures.length > 0) {
        for (const failure of allFailures) {
            const [generatorSetting, setGeneratorSetting] = usePersistentProperty(`EFB_FAILURE_${failure.identifier.toString()}_GENERATORS`, '');
            generatorFailuresGetters.set(failure.identifier, generatorSetting);
            generatorFailuresSetters.set(failure.identifier, setGeneratorSetting);
        }
    }
    return { generatorFailuresGetters, generatorFailuresSetters };
};

export const findGeneratorFailures = (allFailures: readonly Readonly<Failure>[], generatorFailuresGetters: Map<number, string>, generatorUniqueID: string) => {
    const failureIDs: Failure[] = [];
    if (allFailures.length > 0) {
        for (const failure of allFailures) {
            const generatorSetting = generatorFailuresGetters.get(failure.identifier);
            if (generatorSetting) {
                const failureGeneratorsTable = generatorSetting.split(',');
                if (failureGeneratorsTable.length > 0) {
                    for (const generator of failureGeneratorsTable) {
                        if (generator === generatorUniqueID) failureIDs.push(failure);
                    }
                }
            }
        }
    }
    return failureIDs;
};
