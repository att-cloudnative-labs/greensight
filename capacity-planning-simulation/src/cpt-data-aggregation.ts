import { CptEnvironmentIf, CptSimulationProcessIf, CptOutput, CptSimulationNodeIf, CptInformationPackage, genSimId } from './cpt-object';
import { CptGraphModel } from './cpt-graph-model';
import { GraphModel, SimulationConfiguration, SimulationScenario, SimulationNode, SimulationResult, SimulationNodeTypes, UidObject, Process, ProcessInport, ProcessOutport, NumberParam, HistogramAggeregate, SimulationNodeDataAggregate, SimulationNodeAggregatedReport, InportParam, NormalDistNumberParam, DataType, GraphParam, AggregationMethods, SimulationMessage, HistogramBucket, RawNodeDataEntry, AspectNumberParam, Aspect, AspectsAggregate, SimulationMessageRate, MessagesAggregate, AspectParam, ResponseNumberParam, ResponseAspectsAggregate, ResponseAspect, BooleanParam, RateAggregate } from '@cpt/capacity-planning-simulation-types';
import { Variable, VariableProjections, renderProjections, VariableType } from '@cpt/capacity-planning-projection';
import { scaleAspect, dupl, isBoolean } from './cpt-load-ops';
import { sampleNormal } from './cpt-math-ops';
import { buildProcessingElement } from './cpt-pe-repository';
import { isLatencyResponse, responseHistogramAggregation, mergeResponseAspect, flattenResponseAspect, responseSplitHistogramAggregation, getResponseSplitMean, flattenResponseAspectValue } from './cpt-response-ops';

import { genMonths } from './cpt-date-ops';
import { map, reduce, switchMap, zip, concatAll } from 'rxjs/operators';
import { from, Subject, Observable, Observer, of } from 'rxjs';
import { SampleStat } from 'essy-stats';


/**
* Take the raw simulation data and boil it down to something easily consumeable.
* Data from all monte carlo runs of a simulation will be aggregated to a single data set. Including
* some basisc statistic analysis.
* This mainly applies to numerical values (and to a lesser degree to messages).
*
* Simulation run data is stored inside the raw section of the simulationNodes (each active element of a simulation is represented by
* one simulationNode).
*
* In a second step all aspects found attached to simulation nodes are split out into standalone nodes. this helps the frontend.
*
**/

export class CptDataAggregation {

    constructor(public simulationNodes: { [id: string]: SimulationNode }, public scenarios: SimulationScenario[], public dates: string[]) {
    }

    public compute(): { [id: string]: SimulationNode } {
        let allSimulationNodes: { [id: string]: SimulationNode } = {};

        // aggregate all nodes
        for (let nodeId in this.simulationNodes) {
            let node = this.simulationNodes[nodeId];
            this.aggregateNodeReport(node, this.scenarios.map(s => s.objectId), this.dates);
        }
        // break out the aspects
        for (let nodeId in this.simulationNodes) {
            let node = this.simulationNodes[nodeId];
            this.parseNodeForAspects(node);
            allSimulationNodes[nodeId] = node;
        }
        // merge nodes and aspect nodes
        for (let nodeId in this.aspectNodes) {
            allSimulationNodes[nodeId] = this.aspectNodes[nodeId];
        }
        return allSimulationNodes;

    }

    private aspectNodes: { [id: string]: SimulationNode } = {};


    private aggregateNodeReport(simulationNode: SimulationNode, scenarios: string[], dates: string[]) {
        for (let scenarioId of scenarios) {
            if (simulationNode.aggregatedReport === undefined) {
                simulationNode.aggregatedReport = {};
            }
            if (simulationNode.rawData) {
                if (simulationNode.aggregatedReport[scenarioId] === undefined) {
                    simulationNode.aggregatedReport[scenarioId] = {};
                }
                let scenarioReport = simulationNode.aggregatedReport[scenarioId];
                let scenarioRawData = simulationNode.rawData.filter(entry => entry.scenarioId === scenarioId);
                for (let date of dates) {
                    if (scenarioReport[date] === undefined) {
                        scenarioReport[date] = {};
                    }
                    let stepReport = scenarioReport[date];
                    if (stepReport.data === undefined) {
                        (stepReport.data as any) = {};
                    }
                    let stepData = scenarioRawData.filter(entry => entry.stepDate === date);
                    let addedAggregationMethods = this.aggregateStepReport(stepData, stepReport.data);
                    for (let aggregationMethod of addedAggregationMethods) {
                        if (!simulationNode.aggregationMethods) {
                            simulationNode.aggregationMethods = [aggregationMethod];
                        } else {
                            if (simulationNode.aggregationMethods.indexOf(aggregationMethod) < 0) {
                                simulationNode.aggregationMethods.push(aggregationMethod);
                            }
                        }

                    }
                }
            }
            // aggregate responses
            if (simulationNode.rawResponses) {
                if (simulationNode.aggregatedReport[scenarioId] === undefined) {
                    simulationNode.aggregatedReport[scenarioId] = {};
                }
                let scenarioReport = simulationNode.aggregatedReport[scenarioId];
                let scenarioRawResponses = simulationNode.rawResponses.filter(entry => entry.scenarioId === scenarioId);
                for (let date of dates) {
                    if (scenarioReport[date] === undefined) {
                        scenarioReport[date] = {};
                    }
                    let stepReport = scenarioReport[date];
                    let stepData = scenarioRawResponses.filter(entry => entry.stepDate === date);
                    if (stepReport.response === undefined) {
                        (stepReport.response as any) = {};
                    }
                    let addedAggregationMethods = this.aggregateStepReport(stepData, stepReport.response);
                    for (let aggregationMethod of addedAggregationMethods) {
                        if (!simulationNode.aggregationMethods) {
                            simulationNode.aggregationMethods = [aggregationMethod];
                        } else {
                            if (simulationNode.aggregationMethods.indexOf(aggregationMethod) < 0) {
                                simulationNode.aggregationMethods.push(aggregationMethod);
                            }
                        }

                    }
                }

            }
            // if data couldn't be aggregated, remove the empty report structure
            if (simulationNode.aggregationMethods.length == 0) {
                simulationNode.aggregatedReport = {};
            }
        }
    }

    // create BREAKDOWN/SLICE nodes if needed
    // so the frontend's life is a bit easier
    // expecting breakdowns to be static when it comes to slice count and names
    // we just take all aggregated breakdowns and stuff them into an extra simulation node tree
    private parseNodeForAspects(parentSimulationNode: SimulationNode) {
        if (
            parentSimulationNode.aggregationMethods &&
            parentSimulationNode.aggregationMethods.indexOf('ASPECTS') > -1 &&
            parentSimulationNode.aggregationMethods.indexOf('AVG') > -1 &&
            parentSimulationNode.aggregatedReport
        ) {
            for (let scenarioId in parentSimulationNode.aggregatedReport) {
                let scenarioReport = parentSimulationNode.aggregatedReport[scenarioId];
                for (let date in scenarioReport) {
                    let dateReport = scenarioReport[date];
                    if (dateReport.data) {
                        let aspectsAggregate = dateReport.data['ASPECTS'] as AspectsAggregate;
                        let average = dateReport.data['AVG'] as NumberParam;
                        if (aspectsAggregate && average) {

                            for (let aspect of aspectsAggregate.values) {
                                let scaledAspect = scaleAspect(average.value, aspect);
                                let aspectNode = this.getExtraAspectNode(parentSimulationNode, aspect.name);
                                aspectNode.aggregationMethods = ['AVG'];
                                if (!aspectNode.aggregatedReport) {
                                    aspectNode.aggregatedReport = {};
                                }
                                if (!aspectNode.aggregatedReport[scenarioId]) {
                                    aspectNode.aggregatedReport[scenarioId] = {};
                                }
                                if (!aspectNode.aggregatedReport[scenarioId][date]) {
                                    aspectNode.aggregatedReport[scenarioId][date] = {};
                                }
                                if (!aspectNode.aggregatedReport[scenarioId][date]['data']) {
                                    (aspectNode.aggregatedReport[scenarioId][date]['data'] as any) = {};
                                }
                                aspectNode.aggregatedReport[scenarioId][date]['data']['AVG'] = {
                                    type: 'ASPECT_NUMBER',
                                    value: average.value,
                                    aspects: [scaledAspect],
                                    unit: average.unit
                                } as AspectNumberParam;
                                for (let sliceName in scaledAspect.slices) {
                                    let sliceNode = this.getExtraAspectNode(aspectNode, aspect.name, sliceName);
                                    sliceNode.aggregationMethods = ['AVG'];
                                    if (!sliceNode.aggregatedReport) {
                                        sliceNode.aggregatedReport = {};
                                    }
                                    if (!sliceNode.aggregatedReport[scenarioId]) {
                                        sliceNode.aggregatedReport[scenarioId] = {};
                                    }
                                    if (!sliceNode.aggregatedReport[scenarioId][date]) {
                                        sliceNode.aggregatedReport[scenarioId][date] = {};
                                    }
                                    if (!sliceNode.aggregatedReport[scenarioId][date]['data']) {
                                        (sliceNode.aggregatedReport[scenarioId][date]['data'] as any) = {};
                                    }
                                    sliceNode.aggregatedReport[scenarioId][date]['data']['AVG'] = {
                                        type: 'NUMBER',
                                        value: scaledAspect.slices[sliceName],
                                        unit: average.unit
                                    } as NumberParam;
                                }

                            }
                        }
                    }
                }
            }
        }

        // parse for response breakdown nodes
        if (
            parentSimulationNode.aggregationMethods &&
            parentSimulationNode.aggregationMethods.indexOf('RESPONSE_ASPECTS') > -1 &&
            parentSimulationNode.aggregationMethods.indexOf('AVG') > -1 &&
            parentSimulationNode.aggregatedReport
            //TODO: we prob would check for availability of responses in the report
        ) {
            for (let scenarioId in parentSimulationNode.aggregatedReport) {
                let scenarioReport = parentSimulationNode.aggregatedReport[scenarioId];
                for (let date in scenarioReport) {
                    let dateReport = scenarioReport[date];
                    if (dateReport.response) {
                        let aspectsAggregate = dateReport.response['RESPONSE_ASPECTS'] as ResponseAspectsAggregate;
                        let average = dateReport.response['AVG'] as NumberParam;
                        if (aspectsAggregate && average) {

                            for (let aspect of aspectsAggregate.values) {
                                // ignore source breakdowns for now
                                if (!aspect.name.startsWith('__source__')) {
                                    let aspectNode = this.getExtraAspectNode(parentSimulationNode, aspect.name);
                                    let flattenedAspect = flattenResponseAspectValue(aspect);
                                    aspectNode.aggregationMethods = ['AVG'];
                                    if (!aspectNode.aggregatedReport) {
                                        aspectNode.aggregatedReport = {};
                                    }
                                    if (!aspectNode.aggregatedReport[scenarioId]) {
                                        aspectNode.aggregatedReport[scenarioId] = {};
                                    }
                                    if (!aspectNode.aggregatedReport[scenarioId][date]) {
                                        aspectNode.aggregatedReport[scenarioId][date] = {};
                                    }
                                    if (!aspectNode.aggregatedReport[scenarioId][date]['response']) {
                                        (aspectNode.aggregatedReport[scenarioId][date]['response'] as any) = {};
                                    }
                                    aspectNode.aggregatedReport[scenarioId][date]['response']['AVG'] = {
                                        type: 'ASPECT_NUMBER',
                                        value: average.value,
                                        aspects: [flattenedAspect],
                                        unit: average.unit
                                    } as AspectNumberParam;
                                    for (let sliceName in aspect.slices) {
                                        let sliceNode = this.getExtraAspectNode(aspectNode, aspect.name, sliceName);
                                        let histogramNumbers = responseSplitHistogramAggregation(aspect.slices[sliceName]);
                                        sliceNode.aggregationMethods = ['AVG', 'HISTOGRAM'];
                                        if (!sliceNode.aggregatedReport) {
                                            sliceNode.aggregatedReport = {};
                                        }
                                        if (!sliceNode.aggregatedReport[scenarioId]) {
                                            sliceNode.aggregatedReport[scenarioId] = {};
                                        }
                                        if (!sliceNode.aggregatedReport[scenarioId][date]) {
                                            sliceNode.aggregatedReport[scenarioId][date] = {};
                                        }
                                        if (!sliceNode.aggregatedReport[scenarioId][date]['response']) {
                                            (sliceNode.aggregatedReport[scenarioId][date]['response'] as any) = {};
                                        }
                                        sliceNode.aggregatedReport[scenarioId][date]['response']['AVG'] = {
                                            type: 'NUMBER',
                                            value: getResponseSplitMean(aspect.slices[sliceName]),
                                            unit: average.unit
                                        } as NumberParam;
                                        sliceNode.aggregatedReport[scenarioId][date]['response']['HISTOGRAM'] = {
                                            type: 'HISTOGRAM',
                                            buckets: this.generateHistogram(histogramNumbers),
                                        } as HistogramAggeregate
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // hand out the nodes for our special aspect nodes.
    // aspect nodes are setup as children of the source node
    // the slices of the aspect are setup as children of the aspect
    //
    // simnode---aspect---slice
    //                 |--slice
    //                 |--slice

    private getExtraAspectNode(parentSimulationNode: SimulationNode, aspectName: string, sliceName?: string): SimulationNode {
        // generate our simulation id first
        let simulationId = sliceName ? genSimId([aspectName, sliceName], parentSimulationNode.objectId) : genSimId([aspectName], parentSimulationNode.objectId);

        // do we already have that one?
        if (this.aspectNodes[simulationId]) {
            return this.aspectNodes[simulationId];
        }

        //create a fresh one
        let simNode: SimulationNode = {
            objectId: simulationId,
            objectType: 'SIMULATION_NODE',
            type: sliceName ? 'SLICE' : 'BREAKDOWN',
            parentInstanceId: parentSimulationNode.objectId,
            name: sliceName ? sliceName : aspectName
        }
        if (parentSimulationNode.subNodeInstanceIds) {
            if (parentSimulationNode.subNodeInstanceIds.indexOf(simulationId) < 0) {
                parentSimulationNode.subNodeInstanceIds.push(simulationId);
            }
        } else {
            parentSimulationNode.subNodeInstanceIds = [simulationId];
        }
        this.aspectNodes[simulationId] = simNode;
        return simNode;
    }

    // order by mcRun. undefined first
    private orderRawNodeData(a: RawNodeDataEntry, b: RawNodeDataEntry): number {
        if (a.mcRun === undefined && b.mcRun === undefined)
            return 0;
        if (a.mcRun === undefined && b.mcRun !== undefined)
            return -1;
        if (a.mcRun !== undefined && b.mcRun === undefined)
            return 1;
        return a.mcRun - b.mcRun;

    }

    private aggregateAspects(stepData: RawNodeDataEntry[]): AspectsAggregate | null {
        let rawData: AspectNumberParam[] = stepData.sort(this.orderRawNodeData).filter(entry => entry.data.type === 'ASPECT_NUMBER').map(entry => entry.data as AspectNumberParam);
        let aspects: { [aspectName: string]: { [sliceName: string]: number } } = {};
        if (rawData.length > 1) {
            for (let param of rawData) {
                if (param.aspects) {
                    // sum up all aspect slices in our aspects array
                    for (let paramAspect of param.aspects) {
                        if (aspects[paramAspect.name] === undefined) {
                            aspects[paramAspect.name] = {};
                        }
                        for (let sliceName in paramAspect.slices) {
                            if (aspects[paramAspect.name][sliceName] === undefined) {
                                aspects[paramAspect.name][sliceName] = paramAspect.slices[sliceName];
                            } else {
                                aspects[paramAspect.name][sliceName] = aspects[paramAspect.name][sliceName] + paramAspect.slices[sliceName];
                            }
                        }
                    }
                }
            }
            let sampleCount = rawData.length;
            let aspectAggregate: AspectsAggregate = {
                type: 'ASPECTS',
                values: []
            }
            for (let aspectName in aspects) {
                for (let sliceName in aspects[aspectName]) {
                    aspects[aspectName][sliceName] += aspects[aspectName][sliceName] / sampleCount;
                }
                let aggregatedAspect: Aspect = {
                    type: 'BREAKDOWN',
                    slices: aspects[aspectName],
                    name: aspectName
                }
                aspectAggregate.values.push(aggregatedAspect);
            }
            if (aspectAggregate.values.length > 0) {
                return aspectAggregate;
            }
        }

        return null;
    }

    // aggregate all the respone aspects of multiple MC runs into a single
    // list of response aspects
    private aggregateResponseAspects(stepData: RawNodeDataEntry[]): ResponseAspectsAggregate | null {
        let rawData: ResponseNumberParam[] = stepData.sort(this.orderRawNodeData).filter(entry => entry.data.type === 'RESPONSE_NUMBER').map(entry => entry.data as ResponseNumberParam);
        let aspects: { [aspectName: string]: ResponseAspect } = {};
        if (rawData.length > 1) {
            for (let param of rawData) {
                if (param.aspects) {
                    // sum up all aspect slices in our aspects array
                    for (let paramAspect of param.aspects) {
                        if (aspects[paramAspect.name]) {
                            aspects[paramAspect.name] = mergeResponseAspect(aspects[paramAspect.name], paramAspect);
                        } else {
                            aspects[paramAspect.name] = paramAspect;
                        }
                    }
                }
            }
            let aspectAggregate: ResponseAspectsAggregate = {
                type: 'RESPONSE_ASPECTS',
                values: []
            }
            for (let aspectName in aspects) {
                aspectAggregate.values.push(aspects[aspectName]);
            }
            if (aspectAggregate.values.length > 0) {
                return aspectAggregate;
            }
        }
        return null;
    }


    private aggregateStepReport(stepData: RawNodeDataEntry[], stepAggregate: SimulationNodeDataAggregate): AggregationMethods[] {
        let addedAggregationMethods: AggregationMethods[] = [];
        if (stepAggregate && stepData && stepData.length > 0) {
            let orderedStepData = stepData.sort(this.orderRawNodeData);

            let numberData = orderedStepData.filter(entry => entry.data.type === 'NUMBER' || entry.data.type === 'ASPECT_NUMBER' || entry.data.type === 'RESPONSE_NUMBER').map(entry => entry.data as NumberParam | AspectNumberParam | ResponseNumberParam);
            let meanNumber = numberData[0];
            if (numberData.length > 1) {
                let mcValues = numberData.slice(1).map(entry => entry.value);
                // the responses have an extra field with split values.
                // this has to be taken into account instead of the plain entry value.
                let responseValue = numberData.slice(1).filter(n => isLatencyResponse(n) && n.split).map(x => x as ResponseNumberParam);
                if (responseValue.length > 0) {
                    let aggregate = responseHistogramAggregation(responseValue);
                    if (aggregate.length > 0) {
                        mcValues = aggregate;
                    }
                }
                let stats = new SampleStat(mcValues);

                (stepAggregate as any)['HISTOGRAM'] = {
                    type: 'HISTOGRAM',
                    buckets: this.generateHistogram(mcValues),
                    unit: meanNumber.unit
                } as HistogramAggeregate
                if (addedAggregationMethods.indexOf('HISTOGRAM') < 0) {
                    addedAggregationMethods.push('HISTOGRAM');
                }

                // add average
                (stepAggregate as any)['AVG'] = {
                    type: 'NUMBER',
                    value: stats.mean(),
                    unit: meanNumber.unit
                } as NumberParam
                if (addedAggregationMethods.indexOf('AVG') < 0) {
                    addedAggregationMethods.push('AVG');
                }

                (stepAggregate as any)['MIN'] = {
                    type: 'NUMBER',
                    value: stats.min(),
                    unit: meanNumber.unit
                } as NumberParam
                if (addedAggregationMethods.indexOf('MIN') < 0) {
                    addedAggregationMethods.push('MIN');
                }

                (stepAggregate as any)['MAX'] = {
                    type: 'NUMBER',
                    value: stats.max(),
                    unit: meanNumber.unit
                } as NumberParam
                if (addedAggregationMethods.indexOf('MAX') < 0) {
                    addedAggregationMethods.push('MAX');
                }

                (stepAggregate as any)['NINETIETH'] = {
                    type: 'NUMBER',
                    value: stats.quantile(0.9),
                    unit: meanNumber.unit
                } as NumberParam
                if (addedAggregationMethods.indexOf('NINETIETH') < 0) {
                    addedAggregationMethods.push('NINETIETH');
                }

                (stepAggregate as any)['NINETIEFIFTH'] = {
                    type: 'NUMBER',
                    value: stats.quantile(0.95),
                    unit: meanNumber.unit
                } as NumberParam
                if (addedAggregationMethods.indexOf('NINETIEFIFTH') < 0) {
                    addedAggregationMethods.push('NINETIEFIFTH');
                }

                (stepAggregate as any)['NINETIENINTH'] = {
                    type: 'NUMBER',
                    value: stats.quantile(0.99),
                    unit: meanNumber.unit
                } as NumberParam
                if (addedAggregationMethods.indexOf('NINETIENINTH') < 0) {
                    addedAggregationMethods.push('NINETIENINTH');
                }

                // todo: we're expecting the aspect to be everywhere
                if (meanNumber.type === 'ASPECT_NUMBER' && meanNumber.aspects) {
                    let aspectsAggregate = this.aggregateAspects(stepData);
                    if (aspectsAggregate) {
                        (stepAggregate as any)['ASPECTS'] = aspectsAggregate;
                        if (addedAggregationMethods.indexOf('ASPECTS') < 0) {
                            addedAggregationMethods.push('ASPECTS');
                        }
                    }
                }
                if (meanNumber.type === 'RESPONSE_NUMBER' && meanNumber.aspects) {
                    let aspectsAggregate = this.aggregateResponseAspects(stepData);
                    if (aspectsAggregate) {
                        (stepAggregate as any)['RESPONSE_ASPECTS'] = aspectsAggregate;
                        if (addedAggregationMethods.indexOf('RESPONSE_ASPECTS') < 0) {
                            addedAggregationMethods.push('RESPONSE_ASPECTS');
                        }
                    }
                }
            } else if (numberData.length === 1) {
                (stepAggregate as any)['AVG'] = meanNumber;
                addedAggregationMethods = ['AVG'];
                if (meanNumber.type === 'ASPECT_NUMBER' && meanNumber.aspects) {
                    let aspectsAggregate: AspectsAggregate = {
                        type: 'ASPECTS',
                        values: meanNumber.aspects
                    };
                    (stepAggregate as any)['ASPECTS'] = aspectsAggregate;
                    if (addedAggregationMethods.indexOf('ASPECTS') < 0) {
                        addedAggregationMethods.push('ASPECTS');
                    }
                }
            }
            let messageData = orderedStepData.filter(entry => entry.data.type === 'WARNING' || entry.data.type === 'ERROR').map(entry => entry.data as SimulationMessage);
            if (messageData.length > 0) {
                // todo for now we only support a single type of message per element
                let msg = messageData[0];
                let nonBlank = messageData.slice(1).filter(m => !m.blank);
                let smr: SimulationMessageRate = {
                    type: msg.type,
                    name: msg.name,
                    rate: 0
                };
                if (messageData.length === 1) {
                    smr.rate = msg.blank ? 0 : 1;
                } else if (messageData.length > 1) {
                    smr.rate = nonBlank.length / (messageData.length - 1)
                }
                smr.rate = Math.floor(smr.rate * 100);

                let aggregate: MessagesAggregate = {
                    type: 'MESSAGES',
                    values: [smr]
                };
                (stepAggregate as any)['MESSAGES'] = aggregate;
                if (addedAggregationMethods.indexOf('MESSAGES') < 0) {
                    addedAggregationMethods.push('MESSAGES');
                }
            }
            let booleanData = orderedStepData.filter(entry => entry.data.type === 'BOOLEAN').map(entry => entry.data as BooleanParam);
            if (booleanData.length > 0) {
                let rate: number = 0;
                if (booleanData.length > 1) {
                    let trueCount = booleanData.slice(1).filter(d => d.value).length;
                    rate = trueCount / (booleanData.length - 1);
                } else {
                    // just a single entry
                    rate = booleanData[0].value ? 1 : 0;
                }
                rate = Math.floor(rate * 100);
                let rateAggregate: RateAggregate = {
                    type: 'RATE',
                    value: rate
                };

                (stepAggregate as any)['RATE'] = rateAggregate;
                if (addedAggregationMethods.indexOf('RATE') < 0) {
                    addedAggregationMethods.push('RATE');
                }

            }
        }

        return addedAggregationMethods;
    }

    // sort all values in the input into a couple of buckets
    // to drive histogram display
    private generateHistogram(values: number[]): HistogramBucket[] {
        let bucketList: HistogramBucket[] = [];
        let bucketCount = 10;
        let stats = new SampleStat(values);
        let delta = Math.ceil(stats.max() - stats.min());
        if (bucketCount > delta) {
            bucketCount = delta;
        }

        let lowEnd = Math.floor(stats.min());
        let highEnd = Math.ceil(stats.max());
        if (lowEnd === highEnd) {
            // all in 1 bucket
            bucketList.push({
                min: lowEnd - 1,
                max: highEnd + 1,
                count: values.length
            });
        } else {
            let bucketWidth = Math.ceil((highEnd - lowEnd) / bucketCount);
            let bucketMin = lowEnd;
            let bucketMax = lowEnd;
            while (bucketMax < highEnd) {
                bucketMax += bucketWidth;
                bucketList.push({
                    min: bucketMin,
                    max: bucketMax,
                    count: 0
                });
                bucketMin = bucketMax;

            }
            for (let v of values) {
                for (let bucket of bucketList) {
                    if (v >= bucket.min && (v < bucket.max || v == bucket.max && v == highEnd)) {
                        bucket.count++;
                        break;
                    }
                }
            }
        }
        return bucketList;
    }

}
