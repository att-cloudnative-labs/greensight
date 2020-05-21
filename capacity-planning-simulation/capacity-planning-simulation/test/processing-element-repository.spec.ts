import * as chai from 'chai';
import { describe, it } from 'mocha';
import { getPeRepository, buildProcessingElement } from '../src/index';
import { Inport, Outport, ProcessInterfaceDescription, ProcessPortTemplate, Process } from '@cpt/capacity-planning-simulation-types';
import { genTestParent } from './test-util';

describe("Processing Element Repository", () => {
    let peRepo = getPeRepository();

    before("setting up chai", () => {
        chai.should();
    });

    function inportTest(inport: Inport, inportId?: string) {
        if (inportId) {
            inport.objectId.should.equal(inportId);
        }
        inport.objectType.should.equal('INPORT');
    }

    function outportTest(outport: Outport, outportId?: string) {
        if (outportId) {
            outport.objectId.should.equal(outportId);
        }
        outport.objectType.should.equal('OUTPORT');
    }

    function templateTest(template: ProcessPortTemplate, templateId?: string) {
        if (templateId) {
            template.objectId.should.equal(templateId);
        }
        template.objectType.should.equal('PROCESS_PORT_TEMPLATE');
        for (let inportId in template.inportTemplates) {
            inportTest(template.inportTemplates[inportId], inportId);
        }
        for (let outportId in template.outportTemplates) {
            outportTest(template.outportTemplates[outportId], outportId);
        }
    }

    function basicPeDescriptionTest(pid: ProcessInterfaceDescription, peId?: string) {
        pid.name.should.be.a('string');
        pid.objectType.should.equal('PROCESS_INTERFACE_DESCRIPTION');
        if (peId) {
            pid.objectId.should.equal(peId);
        }
        for (let inportId in pid.inports) {
            inportTest(pid.inports[inportId], inportId);
        }
        for (let outportId in pid.outports) {
            outportTest(pid.outports[outportId], outportId);
        }
        for (let templateId in pid.portTemplates) {
            templateTest(pid.portTemplates[templateId], templateId);
        }
    }

    it("should have valid entries", () => {
        for (let peId in peRepo) {
            basicPeDescriptionTest(peRepo[peId], peId);
        }
    });

    it("should be possible to instantiate all PEs", () => {
        for (let peId in peRepo) {
            let pid = peRepo[peId];
            let peProcess: Process = {
                objectId: '...',
                objectType: 'PROCESS',
                type: 'PROCESSING_ELEMENT',
                ref: peId,
                inports: {},
                outports: {},
                name: pid.name
            }
            let fakeParent = genTestParent();
            let pe = buildProcessingElement(peProcess, fakeParent);
            pe.should.not.be.instanceof(Error);
        }
    });
});
