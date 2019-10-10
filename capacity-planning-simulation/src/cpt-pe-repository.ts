import { CptEnvironmentIf, CptSimulationProcessIf, CptOutput, CptInformationPackage, genSimId, CptSimulationNodeIf } from './cpt-object';
import { GraphModel, Process, NodeTypes, Inport, Outport, ProcessPortTemplate, ProcessInterfaceDescriptionRepository, ProcessInterfaceDescription } from '@cpt/capacity-planning-simulation-types';
import { CptInport, CptOutport, CptPort } from './cpt-port';
import { CptProcessingElement } from './cpt-processing-element';
import { CptPeAddLatency, CptPeAddLatencyDescription } from './processing-elements/cpt-pe-addlatency';
import { CptPeParallelExecution, CptPeParallelExecutionDescription } from './processing-elements/cpt-pe-parallelexecution';
import { CptPeSerialExecution, CptPeSerialExecutionDescription } from './processing-elements/cpt-pe-serial-execution';
import { CptPeSum, CptPeSumDescription } from './processing-elements/cpt-pe-sum';
import { CptPeAddAspect, CptPeAddAspectDescription } from './processing-elements/cpt-pe-addaspect';
import { CptPeSplitByAspect, CptPeSplitByAspectDescription } from './processing-elements/cpt-pe-splitbyaspect';
import { CptPeMultiply, CptPeMultiplyDescription } from './processing-elements/cpt-pe-mult';
import { CptPeWarning, CptPeWarningDescription } from './processing-elements/cpt-pe-warning';
import { CptPeError, CptPeErrorDescription } from './processing-elements/cpt-pe-error';
import { CptPeDivideRoundup, CptPeDivideRoundupDescription } from './processing-elements/cpt-pe-divide-roundup';
import { CptPeRemoveUnit, CptPeRemoveUnitDescription } from './processing-elements/cpt-pe-remove-unit';
import { CptPeRemoveResponse, CptPeRemoveResponseDescription } from './processing-elements/cpt-pe-remove-response';
import { CptPeRemoveAspect, CptPeRemoveAspectDescription } from './processing-elements/cpt-pe-remove-aspect';
import { CptPeExtractBreakdown, CptPeExtractBreakdownDescription } from './processing-elements/cpt-pe-extract-breakdown';
import { CptPeMax, CptPeMaxDescription } from './processing-elements/cpt-pe-max';
import { CptPeMin, CptPeMinDescription } from './processing-elements/cpt-pe-min';
import { CptPeSetUnit, CptPeSetUnitDescription } from './processing-elements/cpt-pe-set-unit';
import { CptPeTestSameUnit, CptPeTestSameUnitDescription } from './processing-elements/cpt-pe-test-same-unit';
import { CptPeTestGreaterThan, CptPeTestGreaterThanDescription } from './processing-elements/cpt-pe-test-greater-than';
import { CptPeConditional, CptPeConditionalDescription } from './processing-elements/cpt-pe-conditional';
import { CptPeSimulationDate, CptPeSimulationDateDescription } from './processing-elements/cpt-pe-simulation-date';
import { CptPeSimulationInterval, CptPeSimulationIntervalDescription } from './processing-elements/cpt-pe-simulation-interval';
import { CptPeReplaceAspect, CptPeReplaceAspectDescription } from './processing-elements/cpt-pe-replace-aspect';
import { CptPeMaxWeightedDescription, CptPeMaxWeighted } from './processing-elements/cpt-pe-max-weighted';
import { CptPeNot, CptPeNotDescription } from './processing-elements/cpt-pe-not';


interface PeConstructor {
    new(Process, CptSimulationProcessIf): CptProcessingElement;
}

interface PeInfo {
    desc: ProcessInterfaceDescription,
    pe: PeConstructor
}

let pelist: PeInfo[] = [
    { desc: CptPeAddLatencyDescription, pe: CptPeAddLatency },
    { desc: CptPeParallelExecutionDescription, pe: CptPeParallelExecution },
    { desc: CptPeSumDescription, pe: CptPeSum },
    { desc: CptPeAddAspectDescription, pe: CptPeAddAspect },
    { desc: CptPeSplitByAspectDescription, pe: CptPeSplitByAspect },
    { desc: CptPeMultiplyDescription, pe: CptPeMultiply },
    { desc: CptPeNotDescription, pe: CptPeNot },
    { desc: CptPeWarningDescription, pe: CptPeWarning },
    { desc: CptPeErrorDescription, pe: CptPeError },
    { desc: CptPeDivideRoundupDescription, pe: CptPeDivideRoundup },
    { desc: CptPeRemoveUnitDescription, pe: CptPeRemoveUnit },
    { desc: CptPeRemoveResponseDescription, pe: CptPeRemoveResponse },
    { desc: CptPeRemoveAspectDescription, pe: CptPeRemoveAspect },
    { desc: CptPeExtractBreakdownDescription, pe: CptPeExtractBreakdown },
    { desc: CptPeMaxDescription, pe: CptPeMax },
    { desc: CptPeMaxWeightedDescription, pe: CptPeMaxWeighted },
    { desc: CptPeMinDescription, pe: CptPeMin },
    { desc: CptPeSetUnitDescription, pe: CptPeSetUnit },
    { desc: CptPeTestSameUnitDescription, pe: CptPeTestSameUnit },
    { desc: CptPeTestGreaterThanDescription, pe: CptPeTestGreaterThan },
    { desc: CptPeConditionalDescription, pe: CptPeConditional },
    { desc: CptPeSimulationDateDescription, pe: CptPeSimulationDate },
    { desc: CptPeSimulationIntervalDescription, pe: CptPeSimulationInterval },
    { desc: CptPeReplaceAspectDescription, pe: CptPeReplaceAspect },
    { desc: CptPeSerialExecutionDescription, pe: CptPeSerialExecution }
];

export function buildProcessingElement(proc: Process, parent: CptSimulationProcessIf): CptSimulationProcessIf | Error {
    if (proc.type !== 'PROCESSING_ELEMENT') {
        return Error("can only build processing elements. " + proc.ref)
    }
    for (let pe of pelist) {
        if (pe.desc.objectId === proc.ref) {
            return new pe.pe(proc, parent);
        }
    }
    return Error("unknown processing element " + proc.ref);
}

export function getPeRepository(): ProcessInterfaceDescriptionRepository {
    let repo: ProcessInterfaceDescriptionRepository = {};
    for (let pe of pelist) {
        repo[pe.desc.objectId] = pe.desc;
    }
    return repo;
}
