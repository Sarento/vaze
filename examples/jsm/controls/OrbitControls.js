import {
  EventDispatcher,
  MOUSE,
  Quaternion,
  Spherical,
  TOUCH,
  Vector2,
  Vector3
} from "../../../build/three.module.js";

class OrbitControls extends EventDispatcher {

  constructor( object, domElement ) {

    super();

    this.object = object;
    this.domElement = domElement;

    // API
    this.enabled = true;

    this.target = new Vector3();

    this.minDistance = 0;
    this.maxDistance = Infinity;

    this.minZoom = 0;
    this.maxZoom = Infinity;

    this.minPolarAngle = 0; // radians
    this.maxPolarAngle = Math.PI; // radians

    this.minAzimuthAngle = - Infinity; // radians
    this.maxAzimuthAngle = Infinity; // radians

    this.enableDamping = false;
    this.dampingFactor = 0.05;

    this.enableZoom = true;
    this.zoomSpeed = 1.0;

    this.enableRotate = true;
    this.rotateSpeed = 1.0;

    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = true;
    this.keyPanSpeed = 7.0;

    this.autoRotate = false;
    this.autoRotateSpeed = 2.0;

    this.enableKeys = true;

    this.keys = {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      BOTTOM: 40
    };

    this.mouseButtons = {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN
    };

    this.touches = {
      ONE: TOUCH.ROTATE,
      TWO: TOUCH.DOLLY_PAN
    };

    // internals
    const scope = this;

    const STATE = {
      NONE: - 1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_DOLLY_PAN: 4
    };

    let state = STATE.NONE;

    const EPS = 0.000001;

    const spherical = new Spherical();
    const sphericalDelta = new Spherical();

    const scale = 1;
    const panOffset = new Vector3();
    const zoomChanged = false;

    const rotateStart = new Vector2();
    const rotateEnd = new Vector2();
    const rotateDelta = new Vector2();

    const panStart = new Vector2();
    const panEnd = new Vector2();
    const panDelta = new Vector2();

    const dollyStart = new Vector2();
    const dollyEnd = new Vector2();
    const dollyDelta = new Vector2();

    function getAutoRotationAngle() {
      return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
    }

    function getZoomScale() {
      return Math.pow( 0.95, scope.zoomSpeed );
    }

    function rotateLeft( angle ) {
      sphericalDelta.theta -= angle;
    }

    function rotateUp( angle ) {
      sphericalDelta.phi -= angle;
    }

    function panLeft( distance, objectMatrix ) {
      const v = new Vector3();
      v.setFromMatrixColumn( objectMatrix, 0 );
      v.multiplyScalar( - distance );
      panOffset.add( v );
    }

    function panUp( distance, objectMatrix ) {
      const v = new Vector3();
      if ( scope.screenSpacePanning === true ) {
        v.setFromMatrixColumn( objectMatrix, 1 );
      } else {
        v.setFromMatrixColumn( objectMatrix, 2 );
      }
      v.multiplyScalar( distance );
      panOffset.add( v );
    }

    const offset = new Vector3();
    const quat = new Quaternion().setFromUnitVectors( object.up, new Vector3( 0, 1, 0 ) );
    const quatInverse = quat.clone().invert();

    this.update = function () {

      const position = scope.object.position;

      offset.copy( position ).sub( scope.target );

      offset.applyQuaternion( quat );

      spherical.setFromVector3( offset );

      if ( scope.autoRotate && state === STATE.NONE ) {
        rotateLeft( getAutoRotationAngle() );
      }

      spherical.theta += sphericalDelta.theta;
      spherical.phi += sphericalDelta.phi;

      spherical.phi = Math.max( scope.minPolarAngle, Math.min( scope.maxPolarAngle, spherical.phi ) );
      spherical.makeSafe();

      spherical.theta = Math.max( scope.minAzimuthAngle, Math.min( scope.maxAzimuthAngle, spherical.theta ) );

      spherical.radius *= scale;

      spherical.radius = Math.max( scope.minDistance, Math.min( scope.maxDistance, spherical.radius ) );

      scope.target.add( panOffset );

      offset.setFromSpherical( spherical );

      offset.applyQuaternion( quatInverse );

      position.copy( scope.target ).add( offset );

      scope.object.lookAt( scope.target );

      if ( scope.enableDamping === true ) {
        sphericalDelta.theta *= ( 1 - scope.dampingFactor );
        sphericalDelta.phi *= ( 1 - scope.dampingFactor );
        panOffset.multiplyScalar( 1 - scope.dampingFactor );
      } else {
        sphericalDelta.set( 0, 0, 0 );
        panOffset.set( 0, 0, 0 );
      }

      return true;
    };
  }
}

export { OrbitControls };
