import './loader.css';

import {
  Scene as Scene$1,
  Vector3,
  AmbientLight,
  DirectionalLight,
  Fog,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  Quaternion
} from 'three';
import { World } from 'ecsy';

import { Transform } from './components/transform';
import { PlayerController } from './components/player-controller';
import { Physics } from './components/physics';
import { SphereCollider } from './components/sphere-collider';
import { Camera } from './components/camera';
import { Scene } from './components/scene';
import { WebGlRenderer } from './components/webgl-renderer';
import { RenderPass } from './components/render-pass';
import { UnrealBloomPass } from './components/unreal-bloom-pass';
import { Weapon ,WeaponType } from './components/weapon';
import { Weapons } from './components/weapons';
import { Raycaster } from './components/raycaster';
import { RaycasterReceiver } from './components/raycast-receiver';
import { Health } from './components/health';
import { ParticleEffectOnDestroy } from './components/particle-effect-on-destroy';
import { ParticleEffectType } from './components/particle-effect';
import { MeshCollider } from './components/mesh-collider';
import { Player } from './components/player';
import { Asteroid } from './components/asteroid';

import { WebGlRendererSystem } from './systems/webgl-renderer-system';
import { InputSystem } from './systems/input-system';
import { PlayerInputSystem } from './systems/player-input-system';
import { PhysicsSystem } from './systems/physics-system';
import { CameraSystem } from './systems/camera-system';
import { TransformSystem } from './systems/transform-system';
import { TimeoutSystem } from './systems/timeout-system';
import { WeaponSystem } from './systems/weapon-system';
import { RaycasterSystem } from './systems/raycaster-system';
import { DestroySystem } from './systems/destroy-system';
import { HealthSystem } from './systems/health-system';
import { ParticleEffectSystem } from './systems/particle-effect-system';
import { ScreenshakeSystem } from './systems/screenshake-system';
import { NetworkSystem } from './systems/network-system';

import { randomNumberGenerator } from './utils/rng';
import { CameraTarget } from './components/camera-target';

export default class Game {
  private lastTime: number;
  private world: World;
  private rng: Function;

  constructor() {
    this.lastTime = performance.now();
    this.world = new World();

    this.init();
  }

  init() {
    this.world
      .registerSystem(NetworkSystem)
      .registerSystem(InputSystem)
      .registerSystem(PlayerInputSystem)
      .registerSystem(DestroySystem)
      .registerSystem(CameraSystem)
      .registerSystem(RaycasterSystem)
      .registerSystem(TimeoutSystem)
      .registerSystem(WeaponSystem)
      .registerSystem(PhysicsSystem)
      .registerSystem(HealthSystem)
      .registerSystem(ParticleEffectSystem)
      .registerSystem(TransformSystem)
      .registerSystem(ScreenshakeSystem)
      .registerSystem(WebGlRendererSystem);

    this.world.createEntity()
      .addComponent(WebGlRenderer, {antialias: true, clearColor: 0x020207});

    const scene = new Scene$1();
    this.world.createEntity().addComponent(Scene, {value: scene});

    this.world.createEntity().addComponent(RenderPass);
    this.world.createEntity().addComponent(UnrealBloomPass);

    const camera = this.world.createEntity()
      .addComponent(Camera, {
        fov: 70,
        aspect: window.innerWidth / window.innerHeight,
        near: 0.1,
        far: 10000,
        handleResize: true
      })
      .addComponent(Transform)
      .addComponent(Raycaster);

    const transform = camera.getMutableComponent(Transform);
    transform.position.y = 1;
    transform.position.z = -4;

    scene.add(new AmbientLight(0x222222));

    let light = new DirectionalLight(0xffffff);
    light.position.set(1, 1, 1);
    scene.add(light);

    light = new DirectionalLight(0x002288);
    light.position.set(-1, -1, -1);
    scene.add(light);

    scene.fog = new Fog(0x020207, 0.04);

    const positions = []
    for (let i = 0; i < 1000; i++) {
      const r = 4000
      const theta = 2 * Math.PI * Math.random()
      const phi = Math.acos(2 * Math.random() - 1)
      const x = r * Math.cos(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000)
      const y = r * Math.sin(theta) * Math.sin(phi) + (-2000 + Math.random() * 4000)
      const z = r * Math.cos(phi) + (-1000 + Math.random() * 2000)
      positions.push(x)
      positions.push(y)
      positions.push(z)
    }

    var geometry = new BufferGeometry();
    var vertices = new Float32Array(positions);
    geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    var material = new PointsMaterial({color: 0xffffff, size: 12.5, fog: false});
    var mesh = new Points(geometry, material);
    scene.add(mesh);

    this.spawnAsteroids(100);
    this.spawnModels(100);
    this.spawnPlayer();
  }

  run() {
    let time = performance.now();
    let delta = time - this.lastTime;

    if (delta > 250) {
      delta = 250;
    }

    this.world.execute(delta, time);

    this.lastTime = time;

    requestAnimationFrame(this.run.bind(this));
  }

  spawnAsteroids(amount: number) {
    const rng = randomNumberGenerator(5);

    for (let i = 0; i < amount; ++i) {
      const scaleValue = [1, 5, 10];
      const scale = scaleValue[Math.floor(rng() * scaleValue.length)];

      const rotation = new Quaternion();
      rotation.setFromAxisAngle(new Vector3(1, 0, 0), rng() * Math.PI * 2);
      rotation.setFromAxisAngle(new Vector3(0, 1, 0), rng() * Math.PI * 2);
      rotation.setFromAxisAngle(new Vector3(0, 0, 1), rng() * Math.PI * 2);

      const asteroid = this.world.createEntity()
        .addComponent(Transform, {
          position: new Vector3(
            (rng() - 0.5) * 120,
            (rng() - 0.5) * 120,
            (rng() - 0.5) * 120
          ),
          rotation,
          scale: new Vector3(scale, scale, scale)
        })
        .addComponent(RaycasterReceiver)
        .addComponent(ParticleEffectOnDestroy, {type: ParticleEffectType.Explosion});

      asteroid.addComponent(Physics);
      asteroid.addComponent(MeshCollider);
      asteroid.addComponent(Asteroid);
    }
  }

  spawnModels(amount: number) {
    for (let i = 0; i < amount; ++i) {
      this.world.createEntity()
        .addComponent(Player)
        .addComponent(Transform, {
          position: new Vector3(
            (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 120
          )
        })
        .addComponent(Physics)
        .addComponent(SphereCollider, {radius: 1.25})
        .addComponent(RaycasterReceiver)
        .addComponent(Health, {value: 100})
        .addComponent(ParticleEffectOnDestroy, {type: ParticleEffectType.Explosion});
    }
  }

  spawnPlayer() {
    const player = this.world.createEntity()
      .addComponent(Player)
      .addComponent(Transform)
      .addComponent(PlayerController, {
        rollLeft: 'KeyQ',
        rollRight: 'KeyE',
        forward: 'KeyW',
        backward: 'KeyS',
        strafeLeft: 'KeyA',
        strafeRight: 'KeyD',
        strafeUp: 'Space',
        strafeDown: 'KeyC',
        boost: 'ShiftLeft',
        weaponPrimary: 0
      })
      .addComponent(CameraTarget)
      .addComponent(Physics)
      .addComponent(SphereCollider, {radius: 1.25})
      .addComponent(Health, {value: 100})
      .addComponent(ParticleEffectOnDestroy, {type: ParticleEffectType.Explosion});

    const weapon1 = this.world.createEntity()
      .addComponent(Transform)
      .addComponent(Weapon, {
        type: WeaponType.Gun,
        offset: new Vector3(0.5, 0, 0.5),
        fireInterval: 100,
        parent: player
      });

    const weapon2 = this.world.createEntity()
      .addComponent(Transform)
      .addComponent(Weapon, {
        type: WeaponType.Gun,
        offset: new Vector3(-0.5, 0, 0.5),
        fireInterval: 100,
        parent: player
      });

    player.addComponent(Weapons, {
      primary: [weapon1, weapon2]
    });
  }
}
