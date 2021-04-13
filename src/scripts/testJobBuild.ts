import {vertices, triangles, transform} from './testVariables';
import {fea, smartslice, chop} from '../smartslice/job/job';
import * as fs from 'fs';
import * as path from 'path';


const testType = smartslice.job.JobType.optimization;

const meshes = new chop.mesh.Mesh();
meshes.transform = transform;
meshes.triangles = triangles;
meshes.vertices = vertices;

const slicer = new chop.slicer.Slicer();

const bc = new chop.model.BoundaryCondition('anchor1', 'mesh1', [4, 5]);

const load = new chop.model.Load('load1', 'mesh1', [44, 45], [-10, 0, 0]);

const steps = new chop.model.Step('step1', [bc], [load]);

const model = new chop.model.Model([meshes], slicer, [steps]);

const material = new fea.model.Material();
material.density = 1.1e-09;
material.elastic = new fea.model.Elastic.Isotropic(1619, 0.35);
material.failure_yield = new fea.model.Yield.VonMises(39);
material.fracture = new fea.model.Fracture(7.42);
material.name = 'ABS';

const extruders = new smartslice.job.Extruder(0, ['ABS']);

const optimization = new smartslice.opt.Optimization();

const job = new smartslice.job.Job(
  testType, model, [material], [extruders], optimization,
);

const outputFile = path.join(
  process.cwd(),
  'testJob.json',
);

try {
  fs.writeFileSync(outputFile, JSON.stringify(job));
} catch (err) {
  console.error(err);
}
