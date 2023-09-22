import React, { useMemo } from 'react';
import { usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    FailureGenContext, FailureGenData,
    setNewSetting, setNewSettingAndResetArm,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';
import { t } from 'instruments/src/EFB/translation';
import { ArrowDownRight, ArrowUpRight } from 'react-bootstrap-icons';
import { ButtonIcon, FailureGeneratorChoiceSetting, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorSettingsUI';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';
const additionalSetting = [2, 1, 2, 0, 0, 80, 250];
const numberOfSettingsPerGenerator = 7;
const uniqueGenPrefix = 'A';
const genName = 'Altitude';
const alias = () => t('Failures.Generators.GenAlt');
const disableTakeOffRearm = false;

const AltitudeConditionIndex = 4;
const AltitudeMinIndex = 5;
const AltitudeMaxIndex = 6;

export const failureGenConfigAltitude: () => FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it: string) => parseFloat(it)));
        return [];
    }, [setting]);
    return {
        setSetting,
        settings,
        numberOfSettingsPerGenerator,
        uniqueGenPrefix,
        additionalSetting,
        genName,
        alias,
        disableTakeOffRearm,
        generatorSettingComponents,
    };
};

const generatorSettingComponents = (genNumber: number, generatorSettings: FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [
        FailureGeneratorChoiceSetting(t('Failures.Generators.AltitudeCondition'), settings[genNumber * numberOfSettingsPerGenerator + AltitudeConditionIndex], climbDescentMode,
            setNewSettingAndResetArm, generatorSettings, genNumber, AltitudeConditionIndex, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.AltitudeMin'),
            t('Failures.Generators.feet'), 0, settings[genNumber * numberOfSettingsPerGenerator + AltitudeMaxIndex] * 100,
            settings[genNumber * numberOfSettingsPerGenerator + AltitudeMinIndex], 100,
            setNewSetting, generatorSettings, genNumber, AltitudeMinIndex, failureGenContext),
        FailureGeneratorSingleSetting(t('Failures.Generators.AltitudeMax'),
            t('Failures.Generators.feet'), settings[genNumber * numberOfSettingsPerGenerator + AltitudeMinIndex] * 100, 40000,
            settings[genNumber * numberOfSettingsPerGenerator + AltitudeMaxIndex], 100,
            setNewSetting, generatorSettings, genNumber, AltitudeMaxIndex, failureGenContext),
    ];
    return settingTable;
};

const climbDescentMode: (ButtonIcon)[] = [
    {
        icon: (
            <>
                <ArrowUpRight />
            </>),
        settingVar: 0,
        setting: 'Climb',
    },
    {
        icon: (
            <>
                <ArrowDownRight />
            </>),
        settingVar: 1,
        setting: 'Descent',
    },
];
