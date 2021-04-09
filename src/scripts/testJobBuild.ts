import { DefaultMesh } from '../chop/mesh/mesh'
import { Model } from '../chop/model/model'
import { DefaultStep } from '../chop/model/step'
import { DefaultSlicer } from '../chop/slicer/slicer'
import { Material } from '../fea/model/material'
import { Extruder } from '../smartslice/job/extruder'
import{ Job } from '../smartslice/job/job'
import { Optimization } from '../smartslice/opt/optimization'
import * as fs from 'fs'
import * as path from 'path'


const testType = 'validation'

const testChop: Model = {
  steps: new DefaultStep(),
  slicer: new DefaultSlicer(),
  meshes: [new DefaultMesh()]
}

const testBulk: Array<Material> = [ new Material(
  20,
  null,
  null,
  null,
  'testMat',
)]

const testExtruders: Extruder[] = [new Extruder(0, ['testMaterial'])]

const testOptimization: Optimization = new Optimization(2, 1)

// job building method 1
const testJob = new Job(
  testType, testChop, testBulk, testExtruders, testOptimization
)

const outputFile = path.join(
  process.cwd(),
  'testJob.json',
);

try {
  fs.writeFileSync(outputFile, testJob.toJSON())
} catch (err) {
  console.error(err)
}



