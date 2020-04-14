import * as THREE from "three";
import * as CANNON from "cannon";
import { Vector3, Quaternion } from "three";

// type translation from cannon to three

const toVector3 = (v3: CANNON.Vec3): Vector3 => {
  return new THREE.Vector3(v3.x, v3.y, v3.z);
};

const toQuaternion = (q: CANNON.Quaternion): Quaternion => {
  return new THREE.Quaternion(q.x, q.y, q.z, q.w);
};

export function addDice(scene: THREE.Scene): () => void {
  const world = new CANNON.World();

  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;

  world.gravity.set(0, 0, -1);
  world.broadphase = new CANNON.NaiveBroadphase();

  var mass = 5,
    radius = 1.3;
  const boxShape = new CANNON.Box(new CANNON.Vec3(0, 0, 0));
  const body = new CANNON.Body({ mass: mass });
  body.addShape(boxShape);
  body.position.set(-5, 0, 3);
  world.addBody(body);

  // Create a plane
  var groundShape = new CANNON.Plane();
  var groundBody = new CANNON.Body({ mass: 0 });
  groundBody.addShape(groundShape);
  groundBody.quaternion.setFromAxisAngle(
    new CANNON.Vec3(1, 0, 0),
    -Math.PI / 2
  );
  world.addBody(groundBody);

  var cubeGeo = new THREE.BoxGeometry(1, 1, 1, 10, 10);
  var cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
  const mesh = new THREE.Mesh(cubeGeo, cubeMaterial);
  scene.add(mesh);
  mesh.castShadow = true;

  const update = () => {
    world.step(1 / 60);
    mesh.position.copy(toVector3(body.position));
    mesh.quaternion.copy(toQuaternion(body.quaternion));
  };

  return update;
}
