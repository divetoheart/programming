import * as THREE from "three";

export class PlayerController {
  constructor(camera, world, savedPlayer, lockElement) {
    this.camera = camera;
    this.world = world;
    this.colliders = world.colliders;
    this.lockElement = lockElement;
    this.position = new THREE.Vector3(savedPlayer.x, savedPlayer.y, savedPlayer.z);
    this.yaw = savedPlayer.yaw || 0;
    this.pitch = savedPlayer.pitch || 0;
    this.velocity = new THREE.Vector2();
    this.velocityY = 0;
    this.grounded = true;
    this.radius = .38;
    this.eyeHeight = 1.7;
    this.keys = new Set();
    this.locked = false;
    this.active = false;
    this.bob = 0;
    this.stepPhase = 0;
    this.stepPending = false;
    this.interactPending = false;
    this.speed01 = 0;
    this.sprinting = false;
    this.baseFov = camera.fov;

    this.touch = ("ontouchstart" in window) || matchMedia("(pointer: coarse)").matches;
    this.moveTouch = null;
    this.lookTouch = null;
    this.touchMove = new THREE.Vector2();
    this.touchSprint = false;
    this.touchStarts = new Map();

    camera.rotation.order = "YXZ";
    this.syncCamera();
    this.bindDesktop();
    this.bindTouch();
  }

  bindDesktop() {
    addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (e.code === "Space" && this.grounded && this.active) this.jump();
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("mousemove", (e) => {
      if (!this.locked || this.touch) return;
      this.yaw -= e.movementX * .00195;
      this.pitch -= e.movementY * .00172;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -1.22, 1.18);
    });
    document.addEventListener("pointerlockchange", () => {
      if (this.touch) return;
      this.locked = document.pointerLockElement === this.lockElement;
      this.active = this.locked;
      if (!this.locked) this.keys.clear();
    });
  }

  bindTouch() {
    const el = this.lockElement;
    const opt = { passive:false };

    el.addEventListener("touchstart", (e) => {
      if (!this.touch || !this.active) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        const data = { id:t.identifier, sx:t.clientX, sy:t.clientY, x:t.clientX, y:t.clientY, time:performance.now(), moved:false };
        this.touchStarts.set(t.identifier,data);
        const left = t.clientX < innerWidth * .46;
        if (left && this.moveTouch === null) this.moveTouch = t.identifier;
        else if (this.lookTouch === null) this.lookTouch = t.identifier;
      }
    }, opt);

    el.addEventListener("touchmove", (e) => {
      if (!this.touch || !this.active) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        const data=this.touchStarts.get(t.identifier);
        if (!data) continue;
        const dx=t.clientX-data.x;
        const dy=t.clientY-data.y;
        const totalX=t.clientX-data.sx;
        const totalY=t.clientY-data.sy;
        data.x=t.clientX; data.y=t.clientY;
        if (Math.hypot(totalX,totalY)>7) data.moved=true;

        if (t.identifier===this.moveTouch) {
          const max=86;
          this.touchMove.x=THREE.MathUtils.clamp(totalX/max,-1,1);
          this.touchMove.y=THREE.MathUtils.clamp(-totalY/max,-1,1);
          this.touchSprint=Math.hypot(totalX,totalY)>72;
        } else if (t.identifier===this.lookTouch) {
          this.yaw-=dx*.0041;
          this.pitch-=dy*.00355;
          this.pitch=THREE.MathUtils.clamp(this.pitch,-1.25,1.18);
        }
      }
    }, opt);

    const end=(e)=>{
      if (!this.touch || !this.active) return;
      e.preventDefault();
      for (const t of e.changedTouches) {
        const data=this.touchStarts.get(t.identifier);
        if (data) {
          const duration=performance.now()-data.time;
          const dx=t.clientX-data.sx;
          const dy=t.clientY-data.sy;
          const dist=Math.hypot(dx,dy);
          if (t.identifier===this.lookTouch) {
            if (duration<260 && dist<13) this.interactPending=true;
            else if (duration<430 && dy<-58 && Math.abs(dx)<70) this.jump();
          }
        }
        if (t.identifier===this.moveTouch) {
          this.moveTouch=null;
          this.touchMove.set(0,0);
          this.touchSprint=false;
        }
        if (t.identifier===this.lookTouch) this.lookTouch=null;
        this.touchStarts.delete(t.identifier);
      }
    };
    el.addEventListener("touchend",end,opt);
    el.addEventListener("touchcancel",end,opt);
  }

  activate() {
    this.active=true;
    if (this.touch) {
      this.locked=true;
      return;
    }
    this.requestLock();
  }

  requestLock() {
    if (this.touch) {
      this.active=true;
      this.locked=true;
      return;
    }
    this.lockElement.requestPointerLock?.();
  }

  setBaseFov(fov) {
    this.baseFov=fov;
  }

  jump() {
    if (!this.grounded) return;
    this.velocityY=5.25;
    this.grounded=false;
  }

  consumeInteract() {
    if (!this.interactPending) return false;
    this.interactPending=false;
    return true;
  }

  collides(x,z) {
    for (const c of this.colliders) {
      if (!c.enabled) continue;
      const nx=Math.max(c.minX,Math.min(x,c.maxX));
      const nz=Math.max(c.minZ,Math.min(z,c.maxZ));
      const dx=x-nx, dz=z-nz;
      if (dx*dx+dz*dz<this.radius*this.radius) return true;
    }
    return false;
  }

  update(dt) {
    let forward=(this.keys.has("KeyW")?1:0)-(this.keys.has("KeyS")?1:0);
    let strafe=(this.keys.has("KeyD")?1:0)-(this.keys.has("KeyA")?1:0);

    if (this.touch && this.active) {
      strafe=this.touchMove.x;
      forward=this.touchMove.y;
    }

    let inputMag=Math.hypot(forward,strafe);
    const moving=inputMag>.04;
    if (inputMag>1) { forward/=inputMag; strafe/=inputMag; inputMag=1; }

    const desktopSprint=this.keys.has("ShiftLeft")||this.keys.has("ShiftRight");
    this.sprinting=moving&&(this.touch?this.touchSprint:desktopSprint);

    let targetX=0,targetZ=0;
    if (moving) {
      const sin=Math.sin(this.yaw), cos=Math.cos(this.yaw);
      const speed=(this.sprinting?6.65:4.15)*(this.touch?Math.max(.28,inputMag):1);
      targetX=(strafe*cos-forward*sin)*speed;
      targetZ=(-forward*cos-strafe*sin)*speed;
    }

    const responsiveness=moving?12.5:9.2;
    this.velocity.x=THREE.MathUtils.damp(this.velocity.x,targetX,responsiveness,dt);
    this.velocity.y=THREE.MathUtils.damp(this.velocity.y,targetZ,responsiveness,dt);

    const tx=this.position.x+this.velocity.x*dt;
    if(!this.collides(tx,this.position.z)) this.position.x=tx; else this.velocity.x=0;
    const tz=this.position.z+this.velocity.y*dt;
    if(!this.collides(this.position.x,tz)) this.position.z=tz; else this.velocity.y=0;

    this.velocityY-=13.2*dt;
    this.position.y+=this.velocityY*dt;
    const ground=this.world.groundHeight?.(this.position.x,this.position.z)??0;
    if(this.position.y<=ground){
      this.position.y=ground;
      this.velocityY=0;
      this.grounded=true;
    }

    const planarSpeed=this.velocity.length();
    this.speed01=THREE.MathUtils.clamp(planarSpeed/6.65,0,1);
    if(this.grounded&&planarSpeed>.55){
      const bobRate=this.sprinting?12.5:9.2;
      const previous=Math.floor(this.stepPhase/Math.PI);
      this.stepPhase+=dt*bobRate;
      const next=Math.floor(this.stepPhase/Math.PI);
      if(next!==previous) this.stepPending=true;
      this.bob+=dt*bobRate;
    }

    const targetFov=this.sprinting?this.baseFov+2.6:this.baseFov;
    const nextFov=THREE.MathUtils.damp(this.camera.fov,targetFov,5.5,dt);
    if(Math.abs(nextFov-this.camera.fov)>.01){
      this.camera.fov=nextFov;
      this.camera.updateProjectionMatrix();
    }
    this.syncCamera();
  }

  consumeStep() {
    if(!this.stepPending) return false;
    this.stepPending=false;
    return true;
  }

  syncCamera() {
    const moving=this.grounded&&this.speed01>.08;
    const bobY=moving?Math.sin(this.bob)*(.014+this.speed01*.010):0;
    const bobX=moving?Math.cos(this.bob*.5)*.006*this.speed01:0;
    this.camera.position.set(this.position.x+bobX,this.position.y+this.eyeHeight+bobY,this.position.z);
    this.camera.rotation.y=this.yaw;
    this.camera.rotation.x=this.pitch;
  }

  snapshot() {
    return {
      x:Number(this.position.x.toFixed(3)),
      y:Number(this.position.y.toFixed(3)),
      z:Number(this.position.z.toFixed(3)),
      yaw:Number(this.yaw.toFixed(4)),
      pitch:Number(this.pitch.toFixed(4))
    };
  }
}
