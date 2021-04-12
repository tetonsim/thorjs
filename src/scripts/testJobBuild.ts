/* eslint @typescript-eslint/no-var-requires: off */

import {Model} from '../chop/model/model';
import {Material} from '../fea/model/material';
import {Extruder} from '../smartslice/job/extruder';
import {Job} from '../smartslice/job/job';
import {Optimization} from '../smartslice/opt/optimization';
import * as fs from 'fs';
import * as path from 'path';

// requires validation json file
const data = require('./validation.json');

const testType = data.type;

const testChop: Model = new Model();

testChop.steps = data.chop.steps;
testChop.slicer = data.chop.slicer;
testChop.meshes = data.chop.meshes;

const testBulk: Array<Material> = [new Material()];

testBulk[0].density = data.bulk[0].density;
testBulk[0].elastic = data.bulk[0].elastic;
testBulk[0].failure_yield = data.bulk[0].failure_yield;
testBulk[0].fracture = data.bulk[0].fracture;
testBulk[0].name = data.bulk[0].name;

const testExtruders: Extruder[] = [new Extruder()];

testExtruders[0] = data.extruders[0];

const testOptimization: Optimization = new Optimization(2, 2);

// job building method 1
const testJob = new Job(
    testType, testChop, testBulk, testExtruders, testOptimization,
);

const outputFile = path.join(
    process.cwd(),
    'testJob.json',
);

//  requires optimization json data
const optimizationData = require('./optimization.json');

const testTypeOpt = optimizationData.job.type;


testChop.steps = optimizationData.job.chop.steps;
testChop.slicer = optimizationData.job.chop.slicer;
testChop.meshes = data.chop.meshes;


testBulk[0].density = data.bulk[0].density;
testBulk[0].elastic = data.bulk[0].elastic;
testBulk[0].failure_yield = data.bulk[0].failure_yield;
testBulk[0].fracture = data.bulk[0].fracture;
testBulk[0].name = data.bulk[0].name;

testExtruders[0] = optimizationData.job.extruders[0];


const testJobOptimization = new Job(
    testTypeOpt, testChop, testBulk, testExtruders, testOptimization,
);

const outputFileOpt = path.join(
    process.cwd(),
    'testJobOptimization.json',
);


try {
  fs.writeFileSync(outputFile, JSON.stringify(testJob));
  fs.writeFileSync(outputFileOpt, JSON.stringify(testJobOptimization));
} catch (err) {
  console.error(err);
}
