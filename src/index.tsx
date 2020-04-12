import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";
import * as serviceWorker from "./serviceWorker";
import { writeHeapSnapshot } from "v8";

// from https://blog.bitsrc.io/starting-with-react-16-and-three-js-in-5-minutes-3079b8829817

const Z = 90;
const Y = 89;
const X = 88;

const A = 65;
const B = 66;
const C = 67;

type Direction = "N" | "S" | "NW" | "SW" | "SE" | "NE";

type Resource = "Sheep" | "Ore" | "Brick" | "Wheat" | "Wood";

const ResourceColors: { readonly [key in Resource]: string } = {
  Sheep: "#66BB6A",
  Ore: "#455A64",
  Brick: "#F57C00",
  Wheat: "#FFEE58",
  Wood: "#1B5E20",
};

const dist = 2 * Math.sin(Math.PI / 3);
const DIRECTION_TRANSLATIONS: {
  readonly [key in Direction]: [number, number];
} = {
  NE: [dist * Math.sin(Math.PI / 3), dist * Math.cos(Math.PI / 3)],
  SE: [dist * Math.sin(Math.PI / 3), -dist * Math.cos(Math.PI / 3)],
  NW: [-dist * Math.sin(Math.PI / 3), dist * Math.cos(Math.PI / 3)],
  SW: [-dist * Math.sin(Math.PI / 3), -dist * Math.cos(Math.PI / 3)],
  N: [0, 1 * dist],
  S: [0, -1 * dist],
};

// prettier-ignore
const verticesOfCube = [
  1,1,-1,      1,-1,-1,    -1,-1,-1,   -1,1,-1,
  1,1,1,       1,-1,1,     -1,-1,1,    -1,1,1
];

// prettier-ignore
const indicesOfFaces = [
  0,1,2,       1,2,3,
  4,5,6,       5,6,7,
];

const hexPoints: [number, number][] = [
  [0, Math.sin(Math.PI / 3)],
  [Math.cos(Math.PI / 3), 2 * Math.sin(Math.PI / 3)],
  [1 + Math.cos(Math.PI / 3), 2 * Math.sin(Math.PI / 3)],
  [1 + 2 * Math.cos(Math.PI / 3), 1 * Math.sin(Math.PI / 3)],
  [1 + 1 * Math.cos(Math.PI / 3), 0],
  [1 * Math.cos(Math.PI / 3), 0],
];

const translate = (
  [x, y]: [number, number],
  [dx, dy]: [number, number]
): [number, number] => {
  return [x + dx, y + dy];
};

function choice<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}

const makeHex = function (translation: [number, number]) {
  var shape = new THREE.Shape();
  const points: [
    number,
    number
  ][] = hexPoints.map((hexPoint: [number, number]) =>
    translate(hexPoint, translation)
  );
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.lineTo(points[0][0], points[0][1]);

  var extrudeSettings = {
    steps: 2,
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelOffset: 0,
    bevelSegments: 1,
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
};

const composeTranslations = (
  translations: [number, number][]
): [number, number] => {
  return [
    translations
      .map((t: [number, number]): number => t[0])
      .reduce((a: number, b: number) => a + b, 0),
    translations
      .map((t: [number, number]): number => t[1])
      .reduce((a: number, b: number) => a + b, 0),
  ];
};

class App extends Component {
  componentDidMount() {
    var scene = new THREE.Scene();
    var light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(-3, 0, 2);
    scene.add(light);
    var camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // @ts-ignore
    this.mount.appendChild(renderer.domElement);

    var makeCube = function (
      translation: [number, number],
      color: string
    ): void {
      var geometry = makeHex(translation); // makeTile();
      var material = new THREE.MeshStandardMaterial({ color });
      var cube = new THREE.Mesh(geometry, material);
      scene.add(cube);

      camera.position.z = 5;
    };

    const movements: Direction[][] = [
      [],
      ["N"],
      ["NE"],
      ["NW"],
      ["SW"],
      ["S"],
      ["SE"],
      ["N", "N"],
      ["N", "NE"],
      ["NE", "NE"],
      ["NE", "SE"],
      ["SE", "SE"],
      ["SE", "S"],
      ["S", "S"],
      ["S", "SW"],
      ["SW", "SW"],
      ["SW", "NW"],
      ["NW", "NW"],
      ["NW", "N"],
    ];

    const translations = movements.map((directions): [
      [number, number],
      string
    ] => {
      const position = translate(
        [0, 0],
        composeTranslations(
          directions.map((direction) => DIRECTION_TRANSLATIONS[direction])
        )
      );
      const resource: Resource = choice(
        Object.keys(ResourceColors)
      ) as Resource;
      console.log(resource);
      return [position, ResourceColors[resource]];
    });

    translations.forEach(([translation, color]) =>
      makeCube(translation, color)
    );

    renderer.render(scene, camera);
    //animate();
  }
  render() {
    // @ts-ignore
    return <div ref={(ref) => (this.mount = ref)} />;
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

/*
      if (i === 0) {
        document.addEventListener("keydown", (event) => {
          console.log("handling " + event.keyCode);
          if (event.keyCode === X) {
            console.log("moving X");
            cube.position.x += 1;
          } else if (event.keyCode === Y) {
            console.log("moving Y");
            cube.position.y += 1;
          } else if (event.keyCode === Z) {
            console.log("moving Z");
            cube.position.z += 1;
          }
          if (event.keyCode === A) {
            console.log("rotate X");
            cube.rotation.x += 0.5;
          } else if (event.keyCode === B) {
            console.log("rotate Y");
            cube.rotation.y += 0.5;
          } else if (event.keyCode === C) {
            console.log("rotate Z");
            cube.rotation.z += 0.5;
          }
          renderer.render(scene, camera);
        });
      }
      */
