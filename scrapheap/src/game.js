import * as THREE from 'three';
import { CONFIG, WEAPONS, BOT_NAMES, PALETTE } from './config.js';
import { buildArena } from './arena.js';
import { Actor, updateLooseParts } from './actors.js';
import { Effects } from './effects.js';
import { Controls } from './controls.js';
import { AudioDirector } from './audio.js';

const $ = s => document.querySelector(s);
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, CONFIG.quality.maxDpr)); renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x121817); scene.fog = new THREE.FogExp2(0x151b19, .019);
const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, .08, 120);
scene.add(new THREE.HemisphereLight(0xb8c6b9, 0x251b16, 1.35));
const sun = new THREE.DirectionalLight(0xffd9aa, 2.8); sun.position.set(15, 24, 11); sun.castShadow = true; sun.shadow.mapSize.set(CONFIG.quality.shadowSize, CONFIG.quality.shadowSize); sun.shadow.camera.left = sun.shadow.camera.bottom = -38; sun.shadow.camera.right = sun.shadow.camera.top = 38; sun.shadow.bias = -.001; scene.add(sun);
const rim = new THREE.DirectionalLight(PALETTE.acid, 1.1); rim.position.set(-16, 10, -12); scene.add(rim);

const arena = buildArena(scene), effects = new Effects(scene, camera), audio = new AudioDirector();
const state = { mode: 'menu', time: 0, matchTime: CONFIG.match.duration, ring: CONFIG.arenaRadius, scrap: 0, kills: 0, inventory: [], actors: [], bots: [], loose: [], startedAt: 0, cameraYaw: Math.PI, cameraPitch: .25, stamina: 100, dodging: 0, ringTick: 0, bench: false, freeze: false, qualityTimer: 0, frames: 0, frameTotal: 0 };
let player;

const controls = new Controls(canvas, { attack: () => playerAttack(), dodge: () => dodge(), grab: () => scavenge(), bench: () => toggleBench(), escape: () => state.bench && toggleBench(false) });

function createActor(name, pos, playerControlled = false, i = 0) { return new Actor(scene, { name, player: playerControlled, position: pos, color: playerControlled ? 0xd3482f : [0x874132, 0x4f6570, 0x67513c, 0x805d2e][i % 4], skin: [0xc98961, 0xa9684e, 0xd5a074][i % 3] }); }

function clearMatch() {
  for (const a of state.actors) scene.remove(a.root); for (const p of state.loose) scene.remove(p);
  state.actors.length = state.bots.length = state.loose.length = 0;
}

function resetMatch() {
  clearMatch(); Object.assign(state, { mode: 'playing', time: 0, matchTime: CONFIG.match.duration, ring: CONFIG.arenaRadius, scrap: 0, kills: 0, inventory: [], stamina: 100, dodging: 0, ringTick: 0, bench: false, freeze: false, startedAt: performance.now() });
  player = createActor('SCRAPPER', new THREE.Vector3(0, 0, 10), true); state.actors.push(player);
  for (let i = 0; i < CONFIG.match.bots; i++) { const a = i / CONFIG.match.bots * Math.PI * 2 + .35, r = 20 + (i % 3) * 4; const bot = createActor(BOT_NAMES[i], new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r), false, i); state.actors.push(bot); state.bots.push(bot); }
  $('#menu').classList.remove('active'); $('#result').hidden = true; $('#result').classList.remove('active'); $('#hud').classList.remove('hidden'); if (matchMedia('(pointer:coarse)').matches || innerWidth <= 900) $('#mobile').classList.remove('hidden');
  audio.unlock(); banner('DROP IN', '#d8ff45'); feed('<em>CONTRACT LIVE</em> · only one walks out'); updateHUD();
}

function living() { return state.actors.filter(a => a.alive); }
function vectorForward(yaw, out = new THREE.Vector3()) { return out.set(Math.sin(yaw), 0, Math.cos(yaw)); }

function movePlayer(dt) {
  if (!player?.alive || state.bench) { if (player) player.moveBlend *= .85; controls.sample(); return; }
  const input = controls.sample(); state.cameraYaw += input.yaw; state.cameraPitch = THREE.MathUtils.clamp(state.cameraPitch + input.pitch, -.08, .72);
  const forward = vectorForward(state.cameraYaw), right = new THREE.Vector3(forward.z, 0, -forward.x), dir = new THREE.Vector3().addScaledVector(forward, input.y).addScaledVector(right, input.x);
  if (dir.lengthSq() > 1) dir.normalize();
  const sprinting = input.sprint && state.stamina > 3 && input.y > .2; const speed = sprinting ? CONFIG.player.sprint : CONFIG.player.speed;
  if (sprinting) state.stamina = Math.max(0, state.stamina - dt * 28); else state.stamina = Math.min(100, state.stamina + dt * 19);
  if (state.dodging > 0) { state.dodging -= dt; player.root.position.addScaledVector(player.velocity, dt); }
  else { player.velocity.lerp(dir.multiplyScalar(speed), Math.min(1, dt * 14)); player.root.position.addScaledVector(player.velocity, dt); }
  player.root.position.addScaledVector(player.knockback, dt); player.knockback.multiplyScalar(Math.pow(.025, dt)); arena.resolve(player.root.position);
  player.moveBlend += ((player.velocity.length() > .5 ? 1 : 0) - player.moveBlend) * Math.min(1, dt * 10); if (player.velocity.lengthSq() > .8 && state.dodging <= 0) player.facing = Math.atan2(player.velocity.x, player.velocity.z); else player.facing = state.cameraYaw;
}

function dodge() {
  if (state.mode !== 'playing' || state.bench || !player?.alive || state.stamina < 32 || state.dodging > 0) return;
  const input = controls.sample(), dir = vectorForward(state.cameraYaw); if (Math.abs(input.x) + Math.abs(input.y) > .2) { const right = new THREE.Vector3(dir.z, 0, -dir.x); dir.multiplyScalar(input.y).addScaledVector(right, input.x).normalize(); }
  player.velocity.copy(dir).multiplyScalar(CONFIG.player.dodge); state.stamina -= 32; state.dodging = .36; effects.dust(player.root.position.clone().setY(.2)); audio.tone(135, .12, 'sawtooth', .06, -70);
}

function targetFor(attacker, range, cone = .45) {
  const origin = attacker.root.position, forward = vectorForward(attacker === player ? state.cameraYaw : attacker.facing); let best = null, bestScore = Infinity;
  for (const target of state.actors) { if (target === attacker || !target.alive) continue; const delta = target.root.position.clone().sub(origin), d = delta.length(); if (d > range) continue; const dot = delta.normalize().dot(forward); if (dot < cone) continue; const score = d - dot * 2; if (score < bestScore) { best = target; bestScore = score; } }
  return best;
}

function playerAttack() {
  if (state.mode !== 'playing' || state.bench || !player?.alive || player.attackCooldown > 0 || state.dodging > 0) return;
  player.facing = state.cameraYaw; player.beginAttack(); audio.swing(); const target = targetFor(player, player.weapon.range, player.weapon.id === 'rivetstorm' ? .86 : .42);
  if (target) { const impulse = vectorForward(state.cameraYaw).multiplyScalar(player.weapon.knockback); setTimeout(() => { if (target.alive) applyDamage(target, player.weapon.damage, impulse, player); }, Math.min(130, player.weapon.cooldown * 280)); }
  else effects.dust(player.root.position.clone().add(vectorForward(state.cameraYaw).multiplyScalar(1.5)).setY(.5));
}

function applyDamage(target, damage, impulse, attacker) {
  if (!target.alive || (target === player && state.dodging > .08)) return;
  target.hp -= damage; target.stagger = .18; target.knockback.add(impulse); target.flash(); const hitPos = target.root.position.clone().setY(1.25); const heavy = damage >= 36; effects.impact(hitPos, heavy); audio.hit(heavy);
  if (attacker === player) { const hm = $('#hitmarker'); hm.classList.remove('show'); void hm.offsetWidth; hm.classList.add('show'); }
  if (target.hp > 0 && target.hp < target.maxHp * .48 && Math.random() < .18 && target.partsLost.size < 2) { const choices = ['armL', 'armR', 'legL', 'legR'].filter(k => !target.partsLost.has(k)); const part = target.detach(choices[Math.floor(Math.random() * choices.length)], impulse); if (part) { state.loose.push(part); effects.burst(hitPos, PALETTE.blood, 16, 7); if (target !== player) feed(`${target.name} <em>LOST A PART</em>`); } }
  if (target.hp <= 0) killActor(target, attacker, impulse); updateHUD();
}

function killActor(target, killer, impulse) {
  const dropped = target.ragdoll(impulse.clone().multiplyScalar(1.4).setY(5)); state.loose.push(...dropped); effects.impact(target.root.position.clone().setY(1), true); audio.death();
  if (target === player) return endMatch(false);
  if (killer === player) { state.kills++; const payout = 30 + Math.round(state.matchTime / 25) * 3; state.scrap += payout; feed(`<b>YOU</b> dismantled <em>${target.name}</em> +${payout}⚙`); banner(`+${payout} SCRAP`, '#d8ff45'); }
  else feed(`${killer?.name || 'THE RING'} dismantled <em>${target.name}</em>`);
  if (state.bots.every(b => !b.alive)) endMatch(true); updateHUD();
}

function updateBots(dt) {
  for (const bot of state.bots) {
    if (!bot.alive) continue; bot.attackCooldown = Math.max(0, bot.attackCooldown - dt); bot.stagger = Math.max(0, bot.stagger - dt); if (bot.stagger > 0) { bot.moveBlend *= .8; continue; }
    bot.ai.think -= dt; if (bot.ai.think <= 0 || !bot.ai.target?.alive) { const candidates = living().filter(a => a !== bot).sort((a, b) => a.root.position.distanceToSquared(bot.root.position) - b.root.position.distanceToSquared(bot.root.position)); bot.ai.target = candidates[0]; bot.ai.think = .35 + Math.random() * .35; if (Math.random() < .25) bot.ai.strafe *= -1; }
    const target = bot.ai.target; if (!target) continue; const delta = target.root.position.clone().sub(bot.root.position), d = delta.length(), dir = delta.normalize(); bot.facing = Math.atan2(dir.x, dir.z);
    const range = bot.weapon.range * .78; let move = new THREE.Vector3();
    if (d > range) move.copy(dir); else if (d < range * .55) move.copy(dir).multiplyScalar(-.7); else move.set(dir.z, 0, -dir.x).multiplyScalar(bot.ai.strafe * .55);
    if (bot.hp < 26 && d < 5) move.copy(dir).multiplyScalar(-1);
    const speed = (3.5 + bot.ai.confidence) * (bot.partsLost.has('legL') || bot.partsLost.has('legR') ? .58 : 1); bot.velocity.lerp(move.multiplyScalar(speed), Math.min(1, dt * 6)); bot.root.position.addScaledVector(bot.velocity, dt); bot.root.position.addScaledVector(bot.knockback, dt); bot.knockback.multiplyScalar(Math.pow(.03, dt)); arena.resolve(bot.root.position); bot.moveBlend += ((bot.velocity.length() > .3 ? 1 : 0) - bot.moveBlend) * Math.min(1, dt * 8);
    if (d < range && bot.attackCooldown <= 0 && Math.random() < dt * 7) { bot.beginAttack(); const force = dir.clone().multiplyScalar(bot.weapon.knockback * .75); setTimeout(() => { if (bot.alive && target.alive && bot.root.position.distanceTo(target.root.position) < range + .7) applyDamage(target, bot.weapon.damage * .63, force, bot); }, 130); }
    if (bot.weapon.id === 'knuckles' && Math.random() < dt * .014 && state.time > 25) bot.setWeapon(WEAPONS[1 + Math.floor(Math.random() * Math.min(3, 1 + state.time / 50))]);
  }
}

function scavenge() {
  if (state.mode !== 'playing' || state.bench || !player?.alive) return; let best = null, dist = 2.6;
  for (const part of state.loose) { if (part.userData.held) continue; const d = part.position.distanceTo(player.root.position); if (d < dist) { best = part; dist = d; } }
  if (!best) return banner('NOTHING TO GRAB', '#efe6ce'); best.userData.held = true; state.inventory.push(best.userData.partType || 'BONE'); scene.remove(best); state.loose.splice(state.loose.indexOf(best), 1); state.scrap += 3; audio.pickup(); banner(`RECOVERED ${best.userData.partType || 'BONE'}`, '#d8ff45'); updateHUD();
}

function nearestPart() { let best = null, d = 2.7; for (const p of state.loose) { const pd = p.position.distanceTo(player.root.position); if (pd < d) { best = p; d = pd; } } return best; }
function nearBench() { return player && player.root.position.distanceTo(arena.bench.position) < 6.2; }
function toggleBench(force) {
  if (state.mode !== 'playing' || !player?.alive) return; if (!state.bench && !nearBench()) return banner('FIND THE ACID-LIT BENCH', '#efe6ce');
  state.bench = force ?? !state.bench; $('#bench').hidden = !state.bench; if (state.bench) { document.exitPointerLock?.(); buildRecipes(); } updateHUD();
}

function buildRecipes() {
  $('#recipes').innerHTML = '';
  for (const w of WEAPONS.slice(1)) { const matches = w.parts.filter(p => state.inventory.includes(p)).length, discount = matches * 16, price = Math.max(5, w.cost - discount), owned = player.weapon.id === w.id; const button = document.createElement('button'); button.className = 'recipe'; button.disabled = state.scrap < price && !owned; button.innerHTML = `<span class="ico">${w.icon}</span><span><b>${w.name}</b><small>${w.damage} IMPACT · ${w.note}<br>${matches}/${w.parts.length} MATCHED PARTS</small></span><strong>${owned ? 'EQUIPPED' : `${price}⚙`}</strong>${owned ? '<i class="owned">ACTIVE</i>' : ''}`; button.onclick = () => craft(w, price); $('#recipes').appendChild(button); }
  $('#bench-wallet').textContent = `${state.scrap}⚙ AVAILABLE`;
}

function craft(weapon, price) {
  if (player.weapon.id === weapon.id || state.scrap < price) return; state.scrap -= price; for (const needed of weapon.parts) { const i = state.inventory.indexOf(needed); if (i >= 0) state.inventory.splice(i, 1); } player.setWeapon(weapon); audio.craft(); banner(`BUILT ${weapon.name}`, '#d8ff45'); buildRecipes(); updateHUD();
}

function updateRing(dt) {
  if (state.time > CONFIG.match.ringDelay) { const p = Math.min(1, (state.time - CONFIG.match.ringDelay) / (CONFIG.match.duration - CONFIG.match.ringDelay)); state.ring = THREE.MathUtils.lerp(CONFIG.arenaRadius, CONFIG.match.ringMin, p * p * (3 - 2 * p)); }
  arena.updateRing(state.ring, state.time); state.ringTick -= dt;
  if (state.ringTick <= 0) { state.ringTick = .75; for (const actor of living()) { if (Math.hypot(actor.root.position.x, actor.root.position.z) > state.ring) { applyDamage(actor, 4 + (CONFIG.arenaRadius - state.ring) * .13, actor.root.position.clone().normalize().multiplyScalar(-2), null); if (actor === player) feed('<em>CRUSHER FIELD</em> · get inside'); } } }
}

function updateLoose(dt) { updateLooseParts(state.loose, dt); for (const p of state.loose) { const r = Math.hypot(p.position.x, p.position.z); if (r > 40) { p.position.x *= 40 / r; p.position.z *= 40 / r; } } }

function updateCamera(dt, shake) {
  const focus = player?.root.position || new THREE.Vector3(); if (state.mode === 'menu') state.cameraYaw += dt * .055;
  const forward = vectorForward(state.cameraYaw), right = new THREE.Vector3(forward.z, 0, -forward.x), desired = focus.clone().addScaledVector(forward, -6.4).addScaledVector(right, 1.15); desired.y = 2.4 + state.cameraPitch * 4;
  if (state.mode === 'menu') { desired.set(Math.sin(state.cameraYaw) * 19, 8, Math.cos(state.cameraYaw) * 19); }
  camera.position.lerp(desired, 1 - Math.pow(.001, dt)); if (shake > .002) camera.position.add(new THREE.Vector3((Math.random() - .5) * shake, (Math.random() - .5) * shake, (Math.random() - .5) * shake));
  const look = state.mode === 'menu' ? new THREE.Vector3(0, 2, 0) : focus.clone().setY(1.35).addScaledVector(forward, 2.2); camera.lookAt(look);
}

function updateHUD() {
  if (!player) return; $('#hp').style.width = `${Math.max(0, player.hp)}%`; $('#hp-text').textContent = Math.ceil(Math.max(0, player.hp)); $('#stamina').style.width = `${state.stamina}%`; $('#scrap').textContent = state.scrap; $('#alive').textContent = living().length; $('#weapon').textContent = player.weapon.name; $('#weapon-icon').textContent = player.weapon.icon; $('#weapon-stat').textContent = `${player.weapon.damage} IMPACT · ${player.weapon.note}`; $('#parts').textContent = state.inventory.length ? state.inventory.join(' · ') : 'NO PARTS'; $('#clock').textContent = formatTime(Math.max(0, state.matchTime)); $('#phase-name').textContent = state.time < CONFIG.match.ringDelay ? 'SCAVENGE' : state.ring > 17 ? 'CRUSHER CLOSING' : 'FINAL COMPRESSION'; if (state.bench) $('#bench-wallet').textContent = `${state.scrap}⚙ AVAILABLE`;
}

function updatePrompt() {
  if (!player?.alive || state.bench) return $('#prompt').classList.remove('show'); const part = nearestPart(), prompt = $('#prompt');
  if (part) { prompt.textContent = `[ E ] RECOVER ${part.userData.partType || 'BONE'}`; prompt.classList.add('show'); }
  else if (nearBench()) { prompt.textContent = '[ B ] OPEN JUNK BENCH'; prompt.classList.add('show'); } else prompt.classList.remove('show');
}

function feed(html) { const item = document.createElement('div'); item.innerHTML = html; $('#feed').prepend(item); setTimeout(() => item.remove(), 4600); while ($('#feed').children.length > 5) $('#feed').lastChild.remove(); }
function banner(text, color = '#efe6ce') { const b = $('#banner'); b.textContent = text; b.style.color = color; b.classList.remove('show'); void b.offsetWidth; b.classList.add('show'); }
function formatTime(seconds) { const s = Math.ceil(seconds); return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`; }

function endMatch(win) {
  if (state.mode !== 'playing') return; state.mode = 'ended'; state.bench = false; $('#bench').hidden = true; $('#mobile').classList.add('hidden'); document.exitPointerLock?.();
  setTimeout(() => { $('#hud').classList.add('hidden'); $('#result').hidden = false; $('#result').classList.add('active'); $('#result-kicker').textContent = win ? 'CONTRACT COMPLETE' : 'CONTRACT FAILED'; $('#result-title').textContent = win ? 'KING OF THE HEAP' : 'BACK TO THE PILE'; $('#result-copy').textContent = win ? 'You outlasted the crusher and turned the competition into inventory.' : 'The heap keeps what it takes. Your scrap record survives.'; $('#stat-kills').textContent = state.kills; $('#stat-scrap').textContent = state.scrap; $('#stat-time').textContent = formatTime((performance.now() - state.startedAt) / 1000); const best = Math.max(Number(localStorage.getItem('scrapheap-best') || 0), state.kills); localStorage.setItem('scrapheap-best', best); }, 700);
}

function tick(t) {
  requestAnimationFrame(tick); const dt = Math.min(.04, (t - (tick.last || t)) / 1000); tick.last = t; if (document.hidden) return;
  if (state.mode === 'playing' && !state.freeze) { if (!state.bench) { state.time += dt; state.matchTime -= dt; movePlayer(dt); updateBots(dt); updateRing(dt); if (state.matchTime <= 0) endMatch(state.bots.every(b => !b.alive)); } else controls.sample(); updateLoose(dt); for (const actor of state.actors) actor.animate(dt, state.time); updatePrompt(); updateHUD(); }
  else { state.time += dt; for (const actor of state.actors) actor.animate(dt, state.time); }
  const shake = effects.update(dt); updateCamera(dt, shake); renderer.render(scene, camera);
  state.frames++; state.frameTotal += dt; state.qualityTimer += dt; if (state.qualityTimer > 4) { const fps = state.frames / state.frameTotal; if (fps < 42 && renderer.getPixelRatio() > 1) renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - .2)); state.frames = 0; state.frameTotal = 0; state.qualityTimer = 0; }
}

function preview() { player = createActor('SCRAPPER', new THREE.Vector3(0, 0, 4), true); state.actors.push(player); for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; const bot = createActor(BOT_NAMES[i], new THREE.Vector3(Math.cos(a) * 9, 0, Math.sin(a) * 9), false, i); state.actors.push(bot); state.bots.push(bot); } state.cameraYaw = Math.PI * .6; }

$('#deploy').onclick = resetMatch; $('#replay').onclick = resetMatch; $('#how').onclick = () => $('#how-panel').hidden = !$('#how-panel').hidden; $('#close-bench').onclick = () => toggleBench(false);
addEventListener('resize', () => { renderer.setPixelRatio(Math.min(devicePixelRatio, CONFIG.quality.maxDpr)); renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (state.mode === 'playing') $('#mobile').classList.toggle('hidden', !(matchMedia('(pointer:coarse)').matches || innerWidth <= 900)); });
document.addEventListener('visibilitychange', () => { tick.last = performance.now(); });
canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); state.freeze = true; banner('REBUILDING THE HEAP…'); }); canvas.addEventListener('webglcontextrestored', () => { state.freeze = false; });
preview(); requestAnimationFrame(tick);
