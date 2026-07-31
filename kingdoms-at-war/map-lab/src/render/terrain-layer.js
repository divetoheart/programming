export class TerrainLayer {
  constructor(stack) {
    this.stack = stack;
    this.textureCanvas = document.createElement('canvas');
    this.maskCanvas = document.createElement('canvas');
  }

  setMap(map) {
    this.map = map;
    const { width, height, pixels, mask } = map.terrain;
    this.textureCanvas.width = width;
    this.textureCanvas.height = height;
    this.maskCanvas.width = width;
    this.maskCanvas.height = height;
    this.textureCanvas.getContext('2d').putImageData(new ImageData(pixels, width, height), 0, 0);
    this.maskCanvas.getContext('2d').putImageData(new ImageData(mask, width, height), 0, 0);
  }

  draw(camera) {
    const { context, canvas } = this.stack.get('terrain');
    const dpr = this.stack.dpr;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#101d22');
    gradient.addColorStop(1, '#091319');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.x * dpr, camera.y * dpr);
    context.drawImage(this.textureCanvas, 0, 0, this.map.width, this.map.height);
  }

  applyLandMask(context, camera) {
    const dpr = this.stack.dpr;
    context.save();
    context.globalCompositeOperation = 'destination-in';
    context.setTransform(camera.scale * dpr, 0, 0, camera.scale * dpr, camera.x * dpr, camera.y * dpr);
    context.drawImage(this.maskCanvas, 0, 0, this.map.width, this.map.height);
    context.restore();
  }

  isLand(worldX, worldY) {
    if (!this.map) return false;
    const x = Math.floor(worldX / this.map.width * this.map.terrain.width);
    const y = Math.floor(worldY / this.map.height * this.map.terrain.height);
    if (x < 0 || y < 0 || x >= this.map.terrain.width || y >= this.map.terrain.height) return false;
    return this.map.terrain.mask[(y * this.map.terrain.width + x) * 4 + 3] > 0;
  }
}
