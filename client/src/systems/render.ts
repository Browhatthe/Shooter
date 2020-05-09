import {System} from 'ecsy';
import * as THREE from 'three';
import {Object3d} from '../components/object3d';
import {Position} from '../components/position';
import {Rotation} from '../components/rotation';

export class Render extends System {
  static queries: any = {
    object3d: {
      components: [Object3d],
      listen: {
        added: true
      }
    }
  };

  public queries: any;

  private scene: THREE.Scene;
  private camera: any;
  private renderer: THREE.WebGLRenderer;

  init() {
    const canvas = document.querySelector('canvas');
    this.renderer = new THREE.WebGLRenderer({canvas});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(new THREE.Color('#020207'));
    document.body.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x020207, 100, 700);
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.z = 5;
  }

  execute(delta: number, time: number/*, nextFrameDelta: number*/) {
    this.queries.object3d.added.forEach((entity: any) => {
      this.scene.add(entity.getComponent(Object3d).value);
    });

    this.queries.object3d.results.forEach((entity: any) => {
      const mesh = entity.getMutableComponent(Object3d).value;

      if (entity.hasComponent(Position)) {
        const position = entity.getComponent(Position);

        mesh.position.x = position.x;
        mesh.position.y = position.y;
        mesh.position.z = position.z;
      }

      if (entity.hasComponent(Rotation)) {
        const rotation = entity.getComponent(Rotation);

        mesh.rotation.x = rotation.x;
        mesh.rotation.y = rotation.y;
        mesh.rotation.z = rotation.z;
      }
    });

    this.renderer.render(this.scene, this.camera);
  }
}