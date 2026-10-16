import React from "react";
import { deflateSync } from "node:zlib";
import { renderToStaticMarkup } from "react-dom/server";
import { Resvg } from "@resvg/resvg-js";
import { writeFile } from "node:fs/promises";
import { CupWaterlineSVG } from "../src/components/logo/CupWaterlineSVG";
const mark = renderToStaticMarkup(
  <CupWaterlineSVG
    size={1024}
    waterLevel={65}
    animate={false}
    color="#24332F"
    waterColor="#2F665E"
  />,
);
let content = mark.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
// SVG renderers do not implement CSS inset() or CSS transforms on SVG groups.
content = content
  .replace(
    "<defs>",
    '<defs><clipPath id="icon-water-level"><rect x="0" y="44.1" width="100" height="56"/></clipPath>',
  )
  .replace(
    /<g style="clip-path:[^"]*">/,
    '<g clip-path="url(#icon-water-level)">',
  )
  .replace(/<g style="transform:[^"]*">/, '<g transform="translate(0,-5.9)">');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="#F6F7F3"/><g transform="translate(-14,-14) scale(1.28)">${content}</g></svg>`;
const rendered = new Resvg(svg, { background: "#F6F7F3" }).render();
// App Store icon sources must have no alpha channel, including an unused one.
function chunk(type: string, data: Buffer): Buffer {
  const payload=Buffer.concat([Buffer.from(type),data]);
  let crc=0xffffffff;
  for(const byte of payload) {
    crc^=byte;
    for(let bit=0;bit<8;bit++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  const head=Buffer.alloc(4),tail=Buffer.alloc(4);
  head.writeUInt32BE(data.length);tail.writeUInt32BE((crc^0xffffffff)>>>0);
  return Buffer.concat([head,payload,tail]);
}
const rows=Buffer.alloc((1024*3+1)*1024),pixels=rendered.pixels;
for(let y=0;y<1024;y++) for(let x=0;x<1024;x++) {
  const source=(y*1024+x)*4,target=y*(1024*3+1)+1+x*3;
  if(pixels[source+3]!==255)throw new Error("App icon is not opaque");
  pixels.copy(rows,target,source,source+3);
}
const header=Buffer.alloc(13);header.writeUInt32BE(1024,0);header.writeUInt32BE(1024,4);header[8]=8;header[9]=2;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
await writeFile("public/app-icon.svg", svg);
await writeFile(
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
  png,
);
console.log("App icon generated from the supplied CupWaterlineSVG.");

// Keep the launch screen within the supplied brand; use adaptive, transparent marks.
const { mkdir } = await import('node:fs/promises');
const launchDir='ios/App/App/Assets.xcassets/LaunchMark.imageset';
await mkdir(launchDir,{recursive:true});
for(const mode of ['light','dark']) {
  const shapes=mode==='light'?content:content.replaceAll('#24332F','#EDF2EE').replaceAll('#2F665E','#9CC8BA');
  const launch=`<svg xmlns="http://www.w3.org/2000/svg" width="216" height="216" viewBox="0 0 100 100" fill="none">${shapes}</svg>`;
  await writeFile(`${launchDir}/${mode}.png`,new Resvg(launch).render().asPng());
}
await writeFile(`${launchDir}/Contents.json`,JSON.stringify({images:[{idiom:'universal',filename:'light.png',scale:'1x'},{idiom:'universal',filename:'dark.png',scale:'1x',appearances:[{appearance:'luminosity',value:'dark'}]}],info:{author:'xcode',version:1}},null,2));
