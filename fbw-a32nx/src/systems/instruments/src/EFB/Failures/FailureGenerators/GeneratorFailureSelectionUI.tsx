import React from 'react';
import { FailureGenContext } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { findGeneratorFailures, selectAllFailureChapter, selectAllFailures, setSelectedFailure } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';
import { Failure } from 'failures/src/failures-orchestrator';
import { AtaChapterNumber, AtaChaptersTitle } from '@shared/ata';
import { t } from 'instruments/src/EFB/translation';
import { Toggle } from '../../UtilComponents/Form/Toggle';
import { ScrollableContainer } from '../../UtilComponents/ScrollableContainer';

export function GeneratorFailureSelection(genID: string, failureGenContext: FailureGenContext): JSX.Element {
    const generatorFailureTable: Failure[] = findGeneratorFailures(failureGenContext.allFailures, failureGenContext.generatorFailuresGetters, genID);
    failureGenContext.setFailureGenModalType(0);
    return (
        <div className="flex flex-col justify-center items-start py-2 px-8 w-3/4 border-2 bg-theme-body border-theme-accent">
            <div className="flex flex-row items-start space-x-3 text-left transition duration-100 hover:text-theme-highlight">
                <h1 className="font-bold text-current">
                    {t('Failures.Generators.FailureSelection')}
                </h1>
            </div>
            <div
                className="flex justify-center items-center py-2 px-8 w-full text-center rounded-md border-2
                    transition duration-100 text-theme-text hover:text-theme-highlight bg-theme-accent hover:bg-theme-body
                    border-theme-accent hover:border-theme-highlight"
                onClick={() => {
                    failureGenContext.modals.popModal();
                }}
            >
                {t('Failures.Generators.Close')}
            </div>
            <div className="flex flex-row justify-between ml-10 w-full">
                <div className="text-left">{t('Failures.Generators.FailureSelectionText')}</div>
                <div
                    className="flex flex-row mr-10"
                >
                    <div className="ml-2"><h2>(</h2></div>
                    <div
                        className="mx-2"
                        onClick={() => {
                            selectAllFailures(failureGenContext, genID, true);
                            failureGenContext.setFailureGenModalType(1);
                        }}
                    >
                        <h2 className="hover:text-theme-highlight"><u>{t('Failures.Generators.All')}</u></h2>
                    </div>
                    <div><h2>/</h2></div>
                    <div
                        className="mx-2 hover:text-theme-highlight"
                        onClick={() => {
                            selectAllFailures(failureGenContext, genID, false);
                            failureGenContext.setFailureGenModalType(1);
                        }}
                    >
                        <h2 className="hover:text-theme-highlight"><u>{t('Failures.Generators.None')}</u></h2>
                    </div>
                    <div className="mr-2"><h2>)</h2></div>
                </div>
            </div>
            <ScrollableContainer height={48}>
                <div className="grid grid-cols-2 grid-flow-dense">
                    {failureGenContext.chapters.map<JSX.Element>((chapter) => (
                        <div>
                            <div
                                className="flex flex-row justify-start pt-4 ml-10"
                            >
                                <div><h1>{AtaChaptersTitle[chapter]}</h1></div>
                                <div className="ml-2"><h2>(</h2></div>
                                <div
                                    className="mx-2 hover:text-theme-highlight"
                                    onClick={() => {
                                        selectAllFailureChapter(chapter, failureGenContext, genID, true);
                                        failureGenContext.setFailureGenModalType(1);
                                    }}
                                >
                                    <h2 className="hover:text-theme-highlight"><u>{t('Failures.Generators.All')}</u></h2>
                                </div>
                                <div><h2>/</h2></div>
                                <div
                                    className="mx-2 hover:text-theme-highlight"
                                    onClick={() => {
                                        selectAllFailureChapter(chapter, failureGenContext, genID, false);
                                        failureGenContext.setFailureGenModalType(1);
                                    }}
                                >
                                    <h2 className="hover:text-theme-highlight"><u>{t('Failures.Generators.None')}</u></h2>
                                </div>
                                <div className="mr-2"><h2>)</h2></div>
                            </div>
                            {FailureATAList(failureGenContext, generatorFailureTable, genID, chapter)}
                        </div>
                    ))}
                </div>
            </ScrollableContainer>
        </div>
    );
}
function FailureATAList(failureGenContext: FailureGenContext, generatorFailureTable: Failure[], genID: string, chapter: AtaChapterNumber) {
    const ATAList: JSX.Element[] = failureGenContext.allFailures.map<JSX.Element>((failure) => {
        if (failure.ata === chapter) {
            const active = generatorFailureTable.find((genFailure) => failure.identifier === genFailure.identifier) !== undefined;
            return (
                <div
                    className="flex flex-row pt-2 justify"
                >
                    <Toggle
                        value={active}
                        onToggle={() => {
                            setSelectedFailure(failure, genID, failureGenContext, !active);
                            failureGenContext.setFailureGenModalType(1);
                        }}
                    />
                    <div className="pl-8">{failure.name}</div>
                </div>
            );
        }
        return (<></>);
    });

    return (
        <>
            {ATAList}
        </>
    );
}
