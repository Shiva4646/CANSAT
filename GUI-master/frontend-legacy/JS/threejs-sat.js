(function () {
  class SatelliteVisualization {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.model = null;
      this.animationFrame = null;
      this.orientation = { roll: -0.08, pitch: 89.96, yaw: 69.11 };

      if (!this.container) {
        console.error(`Container with id "${containerId}" not found`);
        return;
      }

      if (typeof THREE === 'undefined') {
        console.error('Three.js is not loaded');
        return;
      }

      this.init();
    }

    init() {
      const width = this.container.clientWidth || 260;
      const height = this.container.clientHeight || 220;

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x05080e);

      this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
      this.camera.position.set(0, 2.6, 6.8);

      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setSize(width, height);
      this.container.appendChild(this.renderer.domElement);

      const ambient = new THREE.AmbientLight(0x8bc5ff, 0.9);
      this.scene.add(ambient);

      const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
      keyLight.position.set(3, 4, 5);
      this.scene.add(keyLight);

      const rimLight = new THREE.DirectionalLight(0x00f0ff, 0.5);
      rimLight.position.set(-4, -2, -3);
      this.scene.add(rimLight);

      this.buildModel();
      this.render();
      this.isInitialized = true;
    }

    buildModel() {
      const group = new THREE.Group();

      const bodyMaterial = new THREE.MeshBasicMaterial({
        color: 0x2f4b6b,
        wireframe: true,
        transparent: true,
        opacity: 0.9
      });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.8, 28, 1, true), bodyMaterial);
      group.add(body);

      const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x87d6ff,
        wireframe: true,
        transparent: true,
        opacity: 0.75
      });
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.5, 20), coreMaterial);
      group.add(core);

      const topRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.12, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0xff7a1a, wireframe: true })
      );
      topRing.rotation.x = Math.PI / 2;
      topRing.position.y = 1.7;
      group.add(topRing);

      const baseRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.2, 0.12, 16, 64),
        new THREE.MeshBasicMaterial({ color: 0x3c8dff, wireframe: true })
      );
      baseRing.rotation.x = Math.PI / 2;
      baseRing.position.y = -1.7;
      group.add(baseRing);

      const finMaterial = new THREE.MeshBasicMaterial({ color: 0x10b6ff, wireframe: true });
      for (let i = 0; i < 4; i += 1) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.86, 0.18), finMaterial);
        const angle = (i / 4) * Math.PI * 2;
        fin.position.set(Math.cos(angle) * 1.3, 0, Math.sin(angle) * 1.3);
        fin.rotation.y = angle;
        group.add(fin);
      }

      this.model = group;
      this.scene.add(this.model);
    }

    updateFromTelemetry(data) {
      const roll = Number(data.roll ?? 0);
      const pitch = Number(data.pitch ?? 0);
      const yaw = Number(data.yaw ?? 0);

      this.orientation = { roll, pitch, yaw };
      if (this.model) {
        this.model.rotation.x = THREE.MathUtils.degToRad(roll);
        this.model.rotation.y = THREE.MathUtils.degToRad(pitch);
        this.model.rotation.z = THREE.MathUtils.degToRad(yaw);
      }

      this.render();
    }

    render() {
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    getOrientation() {
      return this.orientation;
    }
  }

  window.SatelliteVisualization = SatelliteVisualization;
})();

