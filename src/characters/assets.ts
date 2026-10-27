import { AnimatedSprite, Assets, Container, Sprite, Spritesheet, type SpritesheetData } from 'pixi.js';
export type CharacterAsset = { kind: 'layers'; layers: { name: string; url: string; x: number; y: number }[] } | { kind: 'spritesheet'; image: string; data: SpritesheetData; animation: string };
// Bundled local artwork only. Callers own and destroy the returned display tree.
export async function loadCharacterAsset(asset: CharacterAsset): Promise<Container> {
  const local = (url: string) => { if (/^(https?:|\/\/|javascript:)/i.test(url)) throw new Error('Character assets must be bundled locally'); return url; };
  if (asset.kind === 'layers') { const root = new Container(); for (const layer of asset.layers) { const sprite = new Sprite(await Assets.load(local(layer.url))); sprite.label = layer.name; sprite.position.set(layer.x, layer.y); root.addChild(sprite); } return root; }
  const sheet = new Spritesheet(await Assets.load(local(asset.image)), asset.data); await sheet.parse();
  const frames = sheet.animations[asset.animation]; if (!frames?.length) throw new Error('Animation has no frames');
  const sprite = new AnimatedSprite(frames); sprite.animationSpeed = .15; sprite.play(); return sprite;
}
