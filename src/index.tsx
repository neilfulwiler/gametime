import React, { Component } from "react";
import ReactDOM from "react-dom";
import * as THREE from "three";
import * as serviceWorker from "./serviceWorker";
import * as _ from "lodash";
import { shuffle } from "./utils";

// from https://blog.bitsrc.io/starting-with-react-16-and-three-js-in-5-minutes-3079b8829817

type Direction = "N" | "S" | "NW" | "SW" | "SE" | "NE";

type Resource = "Sheep" | "Ore" | "Brick" | "Wheat" | "Wood";

type Robber = "Robber";

const RobberColor = "#847545";

const NUMBERS: (number | Robber)[] = [
  10,
  2,
  9,
  12,
  6,
  4,
  10,
  9,
  11,
  "Robber",
  3,
  8,
  8,
  3,
  4,
  5,
  5,
  6,
  11,
];

const RESOURCES: Resource[] = _.concat(
  Array(4).fill("Sheep"),
  Array(3).fill("Brick"),
  Array(3).fill("Ore"),
  Array(4).fill("Wheat"),
  Array(4).fill("Wood")
) as Resource[];

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

const translate = (
  [x, y]: [number, number],
  [dx, dy]: [number, number]
): [number, number] => {
  return [x + dx, y + dy];
};

const LENGTH = 0.9;
const hexPoints: [number, number][] = [
  [0, Math.sin(Math.PI / 3) * LENGTH],
  [Math.cos(Math.PI / 3) * LENGTH, 2 * Math.sin(Math.PI / 3) * LENGTH],
  [1 + Math.cos(Math.PI / 3) * LENGTH, 2 * Math.sin(Math.PI / 3) * LENGTH],
  [1 + 2 * Math.cos(Math.PI / 3) * LENGTH, 1 * Math.sin(Math.PI / 3) * LENGTH],
  [1 + 1 * Math.cos(Math.PI / 3), 0],
  [Math.cos(Math.PI / 3) * LENGTH, 0],
];

const hexPointsAdjusted = hexPoints.map((point: [number, number]) =>
  translate(point, [
    -Math.cos(Math.PI / 3) * LENGTH - 0.5,
    -Math.sin(Math.PI / 3) * LENGTH,
  ])
);

const makeHex = function (translation: [number, number]) {
  var shape = new THREE.Shape();
  const points: [
    number,
    number
  ][] = hexPointsAdjusted.map((hexPoint: [number, number]) =>
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

// note that none of these uniquely describe anything
type TileCoordinate = Direction[];
type VertexIndex = number; // 0-5, position = Math.PI / 3 * vertexIndex
type VertexCoordinate = [TileCoordinate, VertexIndex];

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

type TileProperties = [[number, number], number | Robber, Resource | Robber];

const polarToCartesian = (radians: number): [number, number] => {
  return [Math.cos(radians), Math.sin(radians)];
};

const cartesianToPolar = ([x, y]: [number, number]): number => {
  if (x === 0) {
    return y > 0 ? Math.PI / 2 : -Math.PI / 2;
  }
  return Math.atan(y / x);
};

const RED = "#ff0000";
const BLUE = "#00ffff";
const BLACK = "#333333";

class App extends Component {
  componentDidMount() {
    var loader = new THREE.FontLoader();

    loader.load("fonts/Roboto Light_Regular.json", (font) => {
      this.withFont(font);
    });
  }

  withFont(font: any) {
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

    var addKeys = function (keys: { [key: string]: () => void }): void {
      document.addEventListener("keypress", (event) => {
        Object.keys(keys).forEach((key: string): void => {
          if (key === event.key) {
            keys[key]();
            renderer.render(scene, camera);
          }
        });
      });
    };

    camera.position.z = 7;
    var cameraPivot = new THREE.Object3D();
    const yAxis = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3(0, 0, 1);
    scene.add(cameraPivot);
    cameraPivot.add(camera);
    camera.lookAt(cameraPivot.position);
    cameraPivot.rotateOnAxis(yAxis, -0.5);
    addKeys({
      a: () => cameraPivot.rotateOnAxis(yAxis, 0.1),
      f: () => cameraPivot.rotateOnAxis(yAxis, -0.1),
    });

    var renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // @ts-ignore
    this.mount.appendChild(renderer.domElement);

    var toXY = function ([directions, vertexIndex]: VertexCoordinate): [
      number,
      number
    ] {
      const position = translate(
        [0, 0],
        composeTranslations(
          directions.map((direction) => DIRECTION_TRANSLATIONS[direction])
        )
      );
      return translate(position, polarToCartesian((vertexIndex * Math.PI) / 3));
    };

    var distance = function (
      [x1, y1]: [number, number],
      [x2, y2]: [number, number]
    ): number {
      return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };

    var makeRoad = function (
      from: VertexCoordinate,
      to: VertexCoordinate,
      color: string
    ): void {
      const [x1, y1] = toXY(from);
      const [x2, y2] = toXY(to);
      const theta = cartesianToPolar([x2 - x1, y2 - y1]);
      const length = distance([x1, y1], [x2, y2]) - 0.25;
      var geometry = new THREE.BoxGeometry(length, 0.1, 0.1);
      var material = new THREE.MeshStandardMaterial({ color });
      var cube = new THREE.Mesh(geometry, material);
      cube.position.x = x1 + (x2 - x1) / 2;
      cube.position.y = y1 + (y2 - y1) / 2;
      cube.position.z = 0.25;
      cube.rotateOnAxis(zAxis, theta);
      scene.add(cube);
    };

    var makeSettlement = function (pos: VertexCoordinate, color: string): void {
      const [x, y] = toXY(pos);
      var geometry = new THREE.BoxGeometry(0.3, 0.2, 0.2);
      var material = new THREE.MeshStandardMaterial({ color });
      var cube = new THREE.Mesh(geometry, material);
      cube.position.x = x;
      cube.position.y = y;
      cube.position.z = 0.25;
      scene.add(cube);
    };

    var makeNumber = function (roll: number, [x, y]: [number, number]): void {
      var textGeometry = new THREE.TextGeometry("" + roll, {
        font: font,
        size: 0.2,
        height: 0.01,
        curveSegments: 1,
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0,
      });

      textGeometry.computeBoundingBox();
      textGeometry.computeVertexNormals();
      const text = new THREE.Mesh(
        new THREE.BufferGeometry().fromGeometry(textGeometry),
        new THREE.MeshStandardMaterial({
          color: roll === 6 || roll === 8 ? "#FF0000" : "#000000",
        })
      );
      text.position.x = x - 0.1;
      text.position.y = y - 0.1;
      text.position.z = 0.22;
      scene.add(text);

      var geometry = new THREE.CircleGeometry(0.2, 32);
      var material = new THREE.MeshStandardMaterial({
        color: "#ffffff",
      });
      var cube = new THREE.Mesh(geometry, material);
      cube.position.x = x;
      cube.position.y = y;
      cube.position.z = 0.2;
      addKeys({
        i: () => (cube.position.z += 0.1),
        k: () => (cube.position.z -= 0.1),
      });
      scene.add(cube);
    };

    var makeCube = function (
      translation: [number, number],
      color: string
    ): void {
      var geometry = makeHex(translation); // makeTile();
      var material = new THREE.MeshStandardMaterial({ color });
      var cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
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

    const numbers = shuffle(NUMBERS);
    const robberIndex = numbers.findIndex((val) => val === "Robber");
    const resources = shuffle(RESOURCES);

    const translations = movements.map(
      (directions, idx): TileProperties => {
        const position = translate(
          [0, 0],
          composeTranslations(
            directions.map((direction) => DIRECTION_TRANSLATIONS[direction])
          )
        );
        return [
          position,
          numbers[idx],
          idx === robberIndex
            ? "Robber"
            : idx > robberIndex
            ? resources[idx - 1]
            : resources[idx],
        ];
      }
    );

    translations.forEach(([translation, number, resource]: TileProperties) => {
      makeCube(
        translation,
        resource === "Robber" ? RobberColor : ResourceColors[resource]
      );
      if (number !== "Robber") {
        makeNumber(number, translation);
      }
    });

    makeRoad([[], 0], [[], 1], RED);
    makeSettlement([[], 0], RED);

    makeRoad([["NW"], 1], [["NW"], 2], RED);
    makeSettlement([["NW"], 1], RED);

    makeRoad([[], 3], [["SW"], 2], BLUE);
    makeSettlement([[], 3], BLUE);

    makeRoad([["SW"], 2], [["SW"], 3], BLUE);
    makeSettlement([["SW"], 3], BLUE);

    makeRoad([["SW", "S"], 0], [["SW", "S"], 1], BLACK);
    makeSettlement([["S", "S"], 2], BLACK);

    makeRoad([["NE"], 2], [["NE", "N"], 3], BLACK);
    makeSettlement([["NE"], 2], BLACK);

    renderer.render(scene, camera);
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
