const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const textExtensions=new Set(['.html','.css','.js','.mjs','.json','.md','.svg','.txt']);
const ignored=new Set(['node_modules','.git']);
const suspiciousPrefixes=[0x00c3,0x00c2,0x00f0,0x00d7,0x00d8,0x00d9].map(codePoint=>String.fromCodePoint(codePoint));
const brokenPunctuation=String.fromCodePoint(0x00e2);

function hasMojibake(text){
  if(text.includes('\uFFFD')||text.includes(brokenPunctuation+String.fromCodePoint(0x20ac))) return true;
  return suspiciousPrefixes.some(prefix=>new RegExp(prefix+'[\\u0080-\\u00BF]').test(text));
}

function files(directory){
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    if(ignored.has(entry.name)||entry.name.endsWith('.fixed')) return [];
    const target=path.join(directory,entry.name);
    return entry.isDirectory()?files(target):textExtensions.has(path.extname(entry.name).toLowerCase())?[target]:[];
  });
}

test('all project text is valid UTF-8 without BOM or mojibake',()=>{
  const failures=[];
  for(const file of files(root)){
    const bytes=fs.readFileSync(file);
    if(bytes[0]===0xef&&bytes[1]===0xbb&&bytes[2]===0xbf) failures.push(`${path.relative(root,file)}: UTF-8 BOM`);
    const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    if(hasMojibake(text)) failures.push(`${path.relative(root,file)}: suspected mojibake`);
  }
  assert.deepEqual(failures,[]);
});

test('central translations preserve the Hebrew Daily Goal label',()=>{
  require(path.join(root,'translations.js'));
  assert.equal(globalThis.EATranslations.he.dailyGoal,'היעד היומי');
});
