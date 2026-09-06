// Cropped from Crownfall's original generated art-direction sheet.
// Atlas order is left-to-right, top-to-bottom.
export const ART_ATLASES={
 portraits:{src:'./assets/generated/portraits-atlas.webp',size:[358,224],cols:4,rows:2,names:['king','queen','warrior','noblewoman','elder','general','priestess','young_lord']},
 banners:{src:'./assets/generated/banners-atlas.webp',size:[384,320],cols:4,rows:2,names:['stag','lion','tree','raven','sun','dragon','spire','blades']},
 settlements:{src:'./assets/generated/settlements-atlas.webp',size:[358,313],cols:4,rows:4,names:['village','town','city','castle','keep','citadel','farm','mill','market','barracks','temple','port','mine','walls']},
 military:{src:'./assets/generated/military-atlas.webp',size:[448,288],cols:4,rows:2,names:['levy','spearman','archer','crossbow','light_cavalry','heavy_cavalry','siege_engine','banner_bearer']},
 environments:{src:'./assets/generated/environments-atlas.webp',size:[537,246],cols:3,rows:2,names:['coast','river_castle','snow','port','ashen','ruins']}
};
export function artFrame(group,name){const a=ART_ATLASES[group],i=a.names.indexOf(name);if(i<0)return null;const cw=a.size[0]/a.cols,ch=a.size[1]/a.rows;return{src:a.src,x:(i%a.cols)*cw,y:Math.floor(i/a.cols)*ch,w:cw,h:ch,atlasW:a.size[0],atlasH:a.size[1]}}
