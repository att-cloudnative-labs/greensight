import { genSimId } from './cpt-object';
import { Aggregate, ResponseParam, SimulationScenario, SimulationNode, NumberParam, HistogramAggregate, SimulationNodeDataAggregate, AggregationMethods, SimulationMessage, HistogramBucket, RawNodeDataEntry, Aspect, AspectsAggregate, SimulationMessageRate, MessagesAggregate, ResponseNumberParam, ResponseAspectsAggregate, ResponseAspect, BooleanParam, RateAggregate } from '@cpt/capacity-planning-simulation-types';
import { isNumber, scaleBreakdown } from './cpt-load-ops';
import {
    responseHistogramAggregation,
    mergeResponseAspect,
    responseValueHistogramAggregation,
    flattenResponseAspectValue, isResponseNumber,
} from './cpt-response-ops';
import { SampleStat } from 'essy-stats';


/**
* Take the raw simulation data and boil it down to something easily consumable.
* Data from all monte carlo runs of a simulation will be aggregated to a single data set. Including
* some basic statistic analysis.
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
        for (let nodeId in this.simulationNodes) {
            let node = this.simulationNodes[nodeId];
            this.parseNodeForMultiCategoryResponses(node);
        }
        allSimulationNodes = { ...this.simulationNodes, ...this.responseCategoryNodes };

        // aggregate all nodes
        for (let nodeId in allSimulationNodes) {
            let node = allSimulationNodes[nodeId];
            this.aggregateNodeReport(node, this.scenarios.map(s => s.objectId), this.dates);
        }
        // break out the aspects
        for (let nodeId in allSimulationNodes) {
            let node = allSimulationNodes[nodeId];
            this.parseNodeForAspects(node);
        }
        // merge nodes and aspect nodes
        for (let nodeId in this.aspectNodes) {
            allSimulationNodes[nodeId] = this.aspectNodes[nodeId];
        }

        // clean out raw data
        for (let nodeId in allSimulationNodes) {
            const node = allSimulationNodes[nodeId];
            delete node.rawResponses;
            delete node.rawData;
        }
        return allSimulationNodes;
    }

    private aspectNodes: { [id: string]: SimulationNode } = {};
    private responseCategoryNodes: { [id: string]: SimulationNode } = {};


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

    private parseNodeForMultiCategoryResponses(parentSimulationNode: SimulationNode) {
        if (parentSimulationNode.rawResponses && parentSimulationNode.rawResponses.length > 0) {
            const responseCategoryData: { [categoryName: string]: RawNodeDataEntry[] } = {};
            for (const respDataEntry of parentSimulationNode.rawResponses) {
                const respParamData = respDataEntry.data as ResponseParam;
                if (!responseCategoryData[respParamData.category]) {
                    responseCategoryData[respParamData.category] = [respDataEntry];
                } else {
                    responseCategoryData[respParamData.category].push(respDataEntry);
                }
            }
            // if there is more than 1 category, we'll go and break them out
            if (Object.keys(responseCategoryData).length > 1) {
                // clean out parents responses
                parentSimulationNode.rawResponses = [];
                for (const category of Object.keys(responseCategoryData)) {
                    const categoryNode = this.getExtraResponseNode(parentSimulationNode, category);
                    categoryNode.rawResponses = responseCategoryData[category];
                }
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
                                let scaledAspect = scaleBreakdown(average.value, aspect);
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
                                    type: 'NUMBER',
                                    value: average.value,
                                    aspects: [scaledAspect],
                                    unit: average.unit
                                } as NumberParam;
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
                                    aspectNode.aggregationMethods = [];
                                    for (const aggMethod in dateReport.response) {
                                        const aggregate: Aggregate = dateReport.response[aggMethod];
                                        if (aggregate.type === 'NUMBER') {
                                            aspectNode.aggregatedReport[scenarioId][date]['response'][aggMethod] = {
                                                type: 'NUMBER',
                                                value: aggregate.value,
                                                aspects: [flattenedAspect],
                                                unit: aggregate.unit
                                            } as NumberParam;
                                            aspectNode.aggregationMethods.push(aggMethod as AggregationMethods);
                                        } else if (aggregate.type === 'HISTOGRAM') {
                                            aspectNode.aggregatedReport[scenarioId][date]['response'][aggMethod] = JSON.parse(JSON.stringify(aggregate));
                                            aspectNode.aggregationMethods.push(aggMethod as AggregationMethods);
                                        }

                                    }

                                    for (let sliceName in aspect.slices) {
                                        let sliceNode = this.getExtraAspectNode(aspectNode, aspect.name, sliceName);
                                        let histogramNumbers = responseValueHistogramAggregation(aspect.slices[sliceName]);
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
                                        let stats = new SampleStat(histogramNumbers);
                                        // add average
                                        sliceNode.aggregatedReport[scenarioId][date]['response']['AVG'] = {
                                            type: 'NUMBER',
                                            value: stats.mean(),
                                        } as NumberParam

                                        sliceNode.aggregatedReport[scenarioId][date]['response']['MIN'] = {
                                            type: 'NUMBER',
                                            value: stats.min(),
                                        } as NumberParam

                                        sliceNode.aggregatedReport[scenarioId][date]['response']['MAX'] = {
                                            type: 'NUMBER',
                                            value: stats.max(),
                                        } as NumberParam

                                        sliceNode.aggregatedReport[scenarioId][date]['response']['NINETIETH'] = {
                                            type: 'NUMBER',
                                            value: stats.quantile(0.9),
                                        } as NumberParam

                                        sliceNode.aggregatedReport[scenarioId][date]['response']['NINETIEFIFTH'] = {
                                            type: 'NUMBER',
                                            value: stats.quantile(0.95),
                                        } as NumberParam
                                        sliceNode.aggregatedReport[scenarioId][date]['response']['NINETIENINTH'] = {
                                            type: 'NUMBER',
                                            value: stats.quantile(0.99),
                                        } as NumberParam
                                        sliceNode.aggregatedReport[scenarioId][date]['response']['HISTOGRAM'] = {
                                            type: 'HISTOGRAM',
                                            buckets: this.generateHistogram(histogramNumbers),
                                        } as HistogramAggregate
                                        sliceNode.aggregationMethods = Object.keys(sliceNode.aggregatedReport[scenarioId][date]['response']) as AggregationMethods[];

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

    private getExtraResponseNode(parentSimulationNode: SimulationNode, category: string): SimulationNode {
        // generate our simulation id first
        let simulationId = genSimId([category], parentSimulationNode.objectId);

        // do we already have that one?
        if (this.responseCategoryNodes[simulationId]) {
            return this.responseCategoryNodes[simulationId];
        }

        //create a fresh one
        let simNode: SimulationNode = {
            objectId: simulationId,
            objectType: 'SIMULATION_NODE',
            type: parentSimulationNode.type,
            parentInstanceId: parentSimulationNode.objectId,
            name: `${parentSimulationNode.name} (${category})`
        }
        if (parentSimulationNode.subNodeInstanceIds) {
            if (parentSimulationNode.subNodeInstanceIds.indexOf(simulationId) < 0) {
                parentSimulationNode.subNodeInstanceIds.push(simulationId);
            }
        } else {
            parentSimulationNode.subNodeInstanceIds = [simulationId];
        }
        this.responseCategoryNodes[simulationId] = simNode;
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

    private aggregateAspects(rawData: NumberParam[]): AspectsAggregate | null {
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

    // aggregate all the response aspects of multiple MC runs into a single
    // list of response aspects
    private aggregateResponseAspects(rawData: ResponseNumberParam[]): ResponseAspectsAggregate | null {
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

    // update step aggregate and return the aggregation methods used
    // it is expected that the stepData set is uniform. i.e. all entries are of the same type
    private aggregateStepReport(stepData: RawNodeDataEntry[], stepAggregate: SimulationNodeDataAggregate): AggregationMethods[] {
        let addedAggregationMethods: AggregationMethods[] = [];
        function addAggMethod(am: AggregationMethods | AggregationMethods[]) {
            if (am instanceof Array) {
                for (const singleAm of am) {
                    addAggMethod(am);
                }
            } else {
                if (addedAggregationMethods.indexOf(am) < 0) {
                    addedAggregationMethods.push(am);
                }
            }
        }

        if (stepAggregate && stepData && stepData.length > 0) {
            let orderedStepData = stepData.sort(this.orderRawNodeData);

            let numberData = orderedStepData.filter(entry => entry.data.type === 'NUMBER' || entry.data.type === 'RESPONSE_NUMBER').map(entry => entry.data as NumberParam | ResponseNumberParam);
            if (numberData.length > 0) {
                const baseNumber = numberData[0];
                let mcValues: number[] = [];

                if (isResponseNumber(baseNumber)) {
                    mcValues = responseHistogramAggregation(numberData as ResponseNumberParam[]);
                } else if (isNumber(baseNumber)) {
                    mcValues = numberData.map(e => (e as NumberParam).value);
                }
                let stats = new SampleStat(mcValues);

                (stepAggregate as any)['HISTOGRAM'] = {
                    type: 'HISTOGRAM',
                    buckets: this.generateHistogram(mcValues),
                    unit: baseNumber.unit
                } as HistogramAggregate
                addAggMethod('HISTOGRAM');

                // add average
                (stepAggregate as any)['AVG'] = {
                    type: 'NUMBER',
                    value: stats.mean(),
                    unit: baseNumber.unit
                } as NumberParam
                addAggMethod('AVG');

                (stepAggregate as any)['MIN'] = {
                    type: 'NUMBER',
                    value: stats.min(),
                    unit: baseNumber.unit
                } as NumberParam
                addAggMethod('MIN');

                (stepAggregate as any)['MAX'] = {
                    type: 'NUMBER',
                    value: stats.max(),
                    unit: baseNumber.unit
                } as NumberParam
                addAggMethod('MAX');

                (stepAggregate as any)['NINETIETH'] = {
                    type: 'NUMBER',
                    value: stats.quantile(0.9),
                    unit: baseNumber.unit
                } as NumberParam
                addAggMethod('NINETIETH');

                (stepAggregate as any)['NINETIEFIFTH'] = {
                    type: 'NUMBER',
                    value: stats.quantile(0.95),
                    unit: baseNumber.unit
                } as NumberParam
                addAggMethod('NINETIEFIFTH');

                (stepAggregate as any)['NINETIENINTH'] = {
                    type: 'NUMBER',
                    value: stats.quantile(0.99),
                    unit: baseNumber.unit
                } as NumberParam
                addAggMethod('NINETIENINTH');

                // todo: we're expecting the aspect to be everywhere
                if (baseNumber.type === 'NUMBER' && baseNumber.aspects) {
                    let aspectsAggregate = this.aggregateAspects(numberData as NumberParam[]);
                    if (aspectsAggregate) {
                        (stepAggregate as any)['ASPECTS'] = aspectsAggregate;
                        addAggMethod('ASPECTS');
                    }
                }
                if (baseNumber.type === 'RESPONSE_NUMBER' && baseNumber.aspects) {
                    let aspectsAggregate = this.aggregateResponseAspects(numberData as ResponseNumberParam[]);
                    if (aspectsAggregate) {
                        (stepAggregate as any)['RESPONSE_ASPECTS'] = aspectsAggregate;
                        addAggMethod('RESPONSE_ASPECTS');
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
