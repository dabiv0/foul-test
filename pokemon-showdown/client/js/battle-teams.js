"use strict";

















































var Teams=new(function(){function _class(){}var _proto=_class.prototype;_proto.
pack=function pack(team){
if(!team)return'';

function getIv(ivs,s){
return ivs[s]===31||ivs[s]===undefined?'':ivs[s].toString();
}

var buf='';for(var _i2=0;_i2<
team.length;_i2++){var set=team[_i2];
if(buf)buf+=']';


buf+=set.name||set.species;


var speciesid=this.packName(set.species||set.name);
buf+="|"+(this.packName(set.name||set.species)===speciesid?'':speciesid);


buf+="|"+this.packName(set.item);


buf+="|"+this.packName(set.ability);


buf+='|'+set.moves.map(this.packName).join(',');


buf+="|"+(set.nature||'');


var evs='|';
if(set.evs){
evs="|"+(set.evs['hp']||'')+","+(set.evs['atk']||'')+","+(set.evs['def']||'')+","+((
set.evs['spa']||'')+","+(set.evs['spd']||'')+","+(set.evs['spe']||''));
}
if(evs==='|,,,,,'){
buf+='|';
}else{
buf+=evs;
}


if(set.gender){
buf+="|"+set.gender;
}else{
buf+='|';
}


var ivs='|';
if(set.ivs){
ivs="|"+getIv(set.ivs,'hp')+","+getIv(set.ivs,'atk')+","+getIv(set.ivs,'def')+","+(
getIv(set.ivs,'spa')+","+getIv(set.ivs,'spd')+","+getIv(set.ivs,'spe'));
}
if(ivs==='|,,,,,'){
buf+='|';
}else{
buf+=ivs;
}


if(set.shiny){
buf+='|S';
}else{
buf+='|';
}


if(set.level&&set.level!==100){
buf+="|"+set.level;
}else{
buf+='|';
}


if(set.happiness!==undefined&&set.happiness!==255){
buf+="|"+set.happiness;
}else{
buf+='|';
}

if(set.pokeball||set.hpType||set.gigantamax||
set.dynamaxLevel!==undefined&&set.dynamaxLevel!==10||set.teraType){
buf+=","+(set.hpType||'');
buf+=","+this.packName(set.pokeball||'');
buf+=","+(set.gigantamax?'G':'');
buf+=","+(set.dynamaxLevel!==undefined&&set.dynamaxLevel!==10?set.dynamaxLevel:'');
buf+=","+(set.teraType||'');
}
}

return buf;
};_proto.

packName=function packName(name){
if(!name)return'';
return name.replace(/[^A-Za-z0-9]+/g,'');
};_proto.

unpack=function unpack(buf){
if(!buf)return[];

var team=[];
var i=0;
var j=0;

while(true){
var set={};
team.push(set);


j=buf.indexOf('|',i);
var name=buf.substring(i,j);
i=j+1;


j=buf.indexOf('|',i);
var species=Dex.species.get(buf.substring(i,j)||name);
set.species=species.name;
if(species.baseSpecies!==name)set.name=name;
i=j+1;


j=buf.indexOf('|',i);
set.item=Dex.items.get(buf.substring(i,j)).name;
i=j+1;


j=buf.indexOf('|',i);
var ability=Dex.abilities.get(buf.substring(i,j)).name;
set.ability=species.abilities&&
['','0','1','H','S'].includes(ability)?species.abilities[ability||'0']:ability;
i=j+1;


j=buf.indexOf('|',i);
set.moves=buf.substring(i,j).split(',').map(
function(moveid){return Dex.moves.get(moveid).name;}
);
i=j+1;


j=buf.indexOf('|',i);
set.nature=buf.substring(i,j);
if(set.nature==='undefined')delete set.nature;
i=j+1;


j=buf.indexOf('|',i);
if(j!==i){
var evstring=buf.substring(i,j);
if(evstring.length>5){
var evs=evstring.split(',');
set.evs={
hp:Number(evs[0])||0,
atk:Number(evs[1])||0,
def:Number(evs[2])||0,
spa:Number(evs[3])||0,
spd:Number(evs[4])||0,
spe:Number(evs[5])||0
};
}else if(evstring==='0'){
set.evs={hp:0,atk:0,def:0,spa:0,spd:0,spe:0};
}
}
i=j+1;


j=buf.indexOf('|',i);
if(i!==j)set.gender=buf.substring(i,j);
i=j+1;


j=buf.indexOf('|',i);
if(j!==i){
var ivs=buf.substring(i,j).split(',');
set.ivs={
hp:ivs[0]===''?31:Number(ivs[0]),
atk:ivs[1]===''?31:Number(ivs[1]),
def:ivs[2]===''?31:Number(ivs[2]),
spa:ivs[3]===''?31:Number(ivs[3]),
spd:ivs[4]===''?31:Number(ivs[4]),
spe:ivs[5]===''?31:Number(ivs[5])
};
}
i=j+1;


j=buf.indexOf('|',i);
if(i!==j)set.shiny=true;
i=j+1;


j=buf.indexOf('|',i);
if(i!==j)set.level=parseInt(buf.substring(i,j),10);
i=j+1;


j=buf.indexOf(']',i);
var misc=void 0;
if(j<0){
if(i<buf.length)misc=buf.substring(i).split(',',6);
}else{
if(i!==j)misc=buf.substring(i,j).split(',',6);
}
if(misc){
set.happiness=misc[0]?Number(misc[0]):undefined;
set.hpType=misc[1]||undefined;
set.pokeball=misc[2]||undefined;
set.gigantamax=!!misc[3]||undefined;
set.dynamaxLevel=misc[4]?Number(misc[4]):undefined;
set.teraType=misc[5]||undefined;
}
if(j<0)break;
i=j+1;
}

return team;
};_proto.
unpackSpeciesOnly=function unpackSpeciesOnly(buf){
if(!buf)return[];

var team=[];
var i=0;

while(true){
var name=buf.slice(i,buf.indexOf('|',i));
i=buf.indexOf('|',i)+1;

team.push(buf.slice(i,buf.indexOf('|',i))||name);

for(var k=0;k<9;k++){
i=buf.indexOf('|',i)+1;
}

i=buf.indexOf(']',i)+1;

if(i<1)break;
}

return team;
};_proto.




exportSet=function exportSet(set){var dex=arguments.length>1&&arguments[1]!==undefined?arguments[1]:Dex;var newFormat=arguments.length>2?arguments[2]:undefined;
var text='';


if(set.name&&set.name!==set.species){
text+=set.name+" ("+set.species+")";
}else{
text+=""+set.species;
}
if(set.gender==='M')text+=" (M)";
if(set.gender==='F')text+=" (F)";
if(!newFormat&&set.item){
text+=" @ "+set.item;
}
text+="\n";
if((set.item||set.ability||dex.gen>=2)&&newFormat){
if(set.ability||dex.gen>=3)text+="["+(set.ability||'(select ability)')+"]";
if(set.item||dex.gen>=2)text+=" @ "+(set.item||"(no item)");
text+="\n";
}else if(set.ability&&set.ability!=='No Ability'){
text+="Ability: "+set.ability+"\n";
}

if(newFormat){
if(set.moves){for(var _i4=0,_set$moves2=
set.moves;_i4<_set$moves2.length;_i4++){var move=_set$moves2[_i4];
if(move.startsWith('Hidden Power ')){
var hpType=move.slice(13);
move=move.slice(0,13);
move=move+"["+hpType+"]";
}
text+="- "+(move||'')+"\n";
}
}
for(var i=((_set$moves3=set.moves)==null?void 0:_set$moves3.length)||0;i<4;i++){var _set$moves3;
text+="- \n";
}
}


var first=true;
if(set.evs||set.nature){
var nature=newFormat?BattleNatures[set.nature]:null;for(var _i6=0,_Dex$statNames2=
Dex.statNames;_i6<_Dex$statNames2.length;_i6++){var _set$evs;var stat=_Dex$statNames2[_i6];
var plusMinus=!newFormat?'':(nature==null?void 0:nature.plus)===stat?'+':(nature==null?void 0:nature.minus)===stat?'-':'';
var ev=((_set$evs=set.evs)==null?void 0:_set$evs[stat])||'';
if(ev===''&&!plusMinus)continue;
text+=first?"EVs: ":" / ";
first=false;
text+=""+ev+plusMinus+" "+BattleStatNames[stat];
}
}
if(!first){
if(set.nature&&newFormat)text+=" ("+set.nature+")";
text+="\n";
}
if(set.nature&&!newFormat){
text+=set.nature+" Nature\n";
}else if(['Hardy','Docile','Serious','Bashful','Quirky'].includes(set.nature)){
text+=set.nature+" Nature\n";
}
first=true;
if(set.ivs){for(var _i8=0,_Dex$statNames4=
Dex.statNames;_i8<_Dex$statNames4.length;_i8++){var _stat=_Dex$statNames4[_i8];
if(set.ivs[_stat]===undefined||isNaN(set.ivs[_stat])||set.ivs[_stat]===31)continue;
if(first){
text+="IVs: ";
first=false;
}else{
text+=" / ";
}
text+=set.ivs[_stat]+" "+BattleStatNames[_stat];
}
}
if(!first){
text+="\n";
}


if(set.level&&set.level!==100){
text+="Level: "+set.level+"\n";
}
if(set.shiny){
text+=!newFormat?"Shiny: Yes\n":"Shiny\n";
}
if(typeof set.happiness==='number'&&set.happiness!==255&&!isNaN(set.happiness)){
text+="Happiness: "+set.happiness+"\n";
}
if(typeof set.dynamaxLevel==='number'&&set.dynamaxLevel!==255&&!isNaN(set.dynamaxLevel)){
text+="Dynamax Level: "+set.dynamaxLevel+"\n";
}
if(set.gigantamax){
text+=!newFormat?"Gigantamax: Yes\n":"Gigantamax\n";
}
if(set.teraType){
text+="Tera Type: "+set.teraType+"\n";
}

if(!newFormat){for(var _i10=0,_ref2=
set.moves||[];_i10<_ref2.length;_i10++){var _move=_ref2[_i10];
if(_move.startsWith('Hidden Power ')){
var _hpType=_move.slice(13);
_move=_move.slice(0,13);
_move=!newFormat?_move+"["+_hpType+"]":""+_move+_hpType;
}
text+="- "+_move+"\n";
}
for(var _i11=((_set$moves4=set.moves)==null?void 0:_set$moves4.length)||0;_i11<4;_i11++){var _set$moves4;
text+="- \n";
}
}

text+="\n";
return text;
};_proto["export"]=




function _export(sets,dex,newFormat){
var text='';for(var _i13=0;_i13<
sets.length;_i13++){var set=sets[_i13];

text+=Teams.exportSet(set,dex,newFormat);
}
return text;
};return _class;}())(
);
//# sourceMappingURL=battle-teams.js.map