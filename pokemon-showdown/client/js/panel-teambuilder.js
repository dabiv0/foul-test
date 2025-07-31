"use strict";function _inheritsLoose(t,o){t.prototype=Object.create(o.prototype),t.prototype.constructor=t,_setPrototypeOf(t,o);}function _setPrototypeOf(t,e){return _setPrototypeOf=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t;},_setPrototypeOf(t,e);}/**
 * Teambuilder panel
 *
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */var







TeambuilderRoom=function(_PSRoom){function TeambuilderRoom(){var _this;for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++){args[_key]=arguments[_key];}_this=_PSRoom.call.apply(_PSRoom,[this].concat(args))||this;_this.
DEFAULT_FORMAT="gen"+Dex.gen;_this.








curFolder='';_this.
curFolderKeep='';_this.

clientCommands=_this.parseClientCommands({
'newteam':function(target){
var isBox=(" "+target+" ").includes(' box ');
if((" "+target+" ").includes(' bottom ')){
PS.teams.push(this.createTeam(null,isBox));
}else{
PS.teams.unshift(this.createTeam(null,isBox));
}
this.update(null);
},
'deleteteam':function(target){
var team=PS.teams.byKey[target];
if(team)PS.teams["delete"](team);
this.update(null);
},
'undeleteteam':function(){
PS.teams.undelete();
this.update(null);
}
});return _this;}_inheritsLoose(TeambuilderRoom,_PSRoom);var _proto=TeambuilderRoom.prototype;_proto.
sendDirect=function sendDirect(msg){
PS.alert("Unrecognized command: "+msg);
};_proto.

createTeam=function createTeam(copyFrom){var isBox=arguments.length>1&&arguments[1]!==undefined?arguments[1]:false;
if(copyFrom){
return{
name:"Copy of "+copyFrom.name,
format:copyFrom.format,
folder:copyFrom.folder,
packedTeam:copyFrom.packedTeam,
iconCache:null,
isBox:copyFrom.isBox,
key:''
};
}else{
var format=this.curFolder&&!this.curFolder.endsWith('/')?this.curFolder:this.DEFAULT_FORMAT;
var folder=this.curFolder.endsWith('/')?this.curFolder.slice(0,-1):'';
return{
name:(isBox?"Box":"Untitled")+" "+(PS.teams.list.length+1),
format:format,
folder:folder,
packedTeam:'',
iconCache:null,
isBox:isBox,
key:''
};
}
};return TeambuilderRoom;}(PSRoom);var


TeambuilderPanel=function(_PSRoomPanel){function TeambuilderPanel(){var _this2;for(var _len2=arguments.length,args=new Array(_len2),_key2=0;_key2<_len2;_key2++){args[_key2]=arguments[_key2];}_this2=_PSRoomPanel.call.apply(_PSRoomPanel,[this].concat(args))||this;_this2.





selectFolder=function(e){
var room=_this2.props.room;
var elem=e.target;
var folder=null;
while(elem){
if(elem.getAttribute('data-href')){
return;
}
if(elem.className==='selectFolder'){
folder=elem.getAttribute('data-value')||'';
break;
}
if(elem.className==='folderlist'){
return;
}
elem=elem.parentElement;
}
if(folder===null)return;
e.preventDefault();
e.stopImmediatePropagation();
if(folder==='++'){
PS.prompt("Folder name?",'',{parentElem:elem,okButton:"Create"}).then(function(name){
if(!name)return;
room.curFolderKeep=name+"/";
room.curFolder=name+"/";
_this2.forceUpdate();
});
return;
}
room.curFolder=folder;
_this2.forceUpdate();
};_this2.
addFormatFolder=function(ev){
var room=_this2.props.room;
var button=ev.currentTarget;
var folder=toID(button.value);
room.curFolderKeep=folder;
room.curFolder=folder;
button.value='';
_this2.forceUpdate();
};_this2.






















dragEnterTeam=function(ev){var _ev$currentTarget;
var draggedTeam=_this2.getDraggedTeam(ev);
if(draggedTeam===null)return;

var value=(_ev$currentTarget=ev.currentTarget)==null?void 0:_ev$currentTarget.getAttribute('data-teamkey');
var team=value?PS.teams.byKey[value]:null;
if(!team||team===draggedTeam)return;

var iOver=PS.teams.list.indexOf(team);
if(typeof draggedTeam==='number'){
if(iOver>=draggedTeam)PS.dragging.team=iOver+1;
PS.dragging.team=iOver;
_this2.forceUpdate();
return;
}

var iDragged=PS.teams.list.indexOf(draggedTeam);
if(iDragged<0||iOver<0)return;

PS.teams.list.splice(iDragged,1);



PS.teams.list.splice(iOver,0,draggedTeam);
_this2.forceUpdate();
};_this2.
dragEnterFolder=function(ev){var _ev$currentTarget2,_PS$dragging;
var value=((_ev$currentTarget2=ev.currentTarget)==null?void 0:_ev$currentTarget2.getAttribute('data-value'))||null;
if(value===null||((_PS$dragging=PS.dragging)==null?void 0:_PS$dragging.type)!=='team')return;
if(value==='++'||value==='')return;

PS.dragging.folder=value;
_this2.forceUpdate();
};_this2.
dragLeaveFolder=function(ev){var _ev$currentTarget3,_PS$dragging2;
var value=((_ev$currentTarget3=ev.currentTarget)==null?void 0:_ev$currentTarget3.getAttribute('data-value'))||null;
if(value===null||((_PS$dragging2=PS.dragging)==null?void 0:_PS$dragging2.type)!=='team')return;
if(value==='++'||value==='')return;

if(PS.dragging.folder===value)PS.dragging.folder=null;
_this2.forceUpdate();
};_this2.





























































dropFolder=function(ev){var _ev$currentTarget4,_PS$dragging3;
var value=((_ev$currentTarget4=ev.currentTarget)==null?void 0:_ev$currentTarget4.getAttribute('data-value'))||null;
if(value===null||((_PS$dragging3=PS.dragging)==null?void 0:_PS$dragging3.type)!=='team')return;
if(value==='++'||value==='')return;

PS.dragging.folder=null;
var team=PS.dragging.team;

if(typeof team==='number'){
return _this2.addDraggedTeam(ev,value);
}

if(value.endsWith('/')){
team.folder=value.slice(0,-1);
}else{
team.format=value;
}
PS.teams.save();
ev.stopImmediatePropagation();
_this2.forceUpdate();
};_this2.
dropPanel=function(ev){var _PS$dragging4;
if(((_PS$dragging4=PS.dragging)==null?void 0:_PS$dragging4.type)!=='team')return;
var team=PS.dragging.team;

if(typeof team==='number'){
return _this2.addDraggedTeam(ev,_this2.props.room.curFolder);
}
};return _this2;}_inheritsLoose(TeambuilderPanel,_PSRoomPanel);var _proto2=TeambuilderPanel.prototype;_proto2.getDraggedTeam=function getDraggedTeam(ev){var _PS$dragging5,_ref;if(((_PS$dragging5=PS.dragging)==null?void 0:_PS$dragging5.type)==='team')return PS.dragging.team;var dataTransfer=ev.dataTransfer;if(!dataTransfer)return null;PS.dragging={type:'?'};console.log("dragging: "+dataTransfer.types+" | "+((_ref=[].concat(dataTransfer.files))==null?void 0:_ref.map(function(file){return file.name;})));if(!(dataTransfer.types.includes!=null&&dataTransfer.types.includes('Files')))return null;if(dataTransfer.files[0]&&!dataTransfer.files[0].name.endsWith('.txt'))return null;PS.dragging={type:'team',team:0,folder:null};return PS.dragging.team;};_proto2.extractDraggedTeam=function extractDraggedTeam(ev){var _ev$dataTransfer,_file$text;var file=(_ev$dataTransfer=ev.dataTransfer)==null||(_ev$dataTransfer=_ev$dataTransfer.files)==null?void 0:_ev$dataTransfer[0];if(!file)return Promise.resolve(null);var name=file.name;if(name.slice(-4).toLowerCase()!=='.txt'){PS.alert("Your file \""+file.name+"\" is not a valid team. Team files are \".txt\" files.");return Promise.resolve(null);}name=name.slice(0,-4);return file.text==null||(_file$text=file.text())==null?void 0:_file$text.then(function(result){var sets;try{sets=PSTeambuilder.importTeam(result);}catch(_unused){PS.alert("Your file \""+file.name+"\" is not a valid team.");return null;}var format='';var bracketIndex=name.indexOf(']');var isBox=false;if(bracketIndex>=0){format=name.slice(1,bracketIndex);if(!format.startsWith('gen'))format='gen6'+format;if(format.endsWith('-box')){format=format.slice(0,-4);isBox=true;}name=$.trim(name.substr(bracketIndex+1));}return{name:name,format:format,folder:'',packedTeam:Teams.pack(sets),iconCache:null,key:'',isBox:isBox};});};_proto2.addDraggedTeam=function addDraggedTeam(ev,folder){var _PS$dragging6,_this3=this;var index=(_PS$dragging6=PS.dragging)==null?void 0:_PS$dragging6.team;if(typeof index!=='number')index=0;this.extractDraggedTeam(ev).then(function(team){if(!team){return;}if(folder!=null&&folder.endsWith('/')){team.folder=folder.slice(0,-1);}else if(folder){team.format=folder;}PS.teams.push(team);PS.teams.list.pop();PS.teams.list.splice(index,0,team);PS.teams.save();_this3.forceUpdate();});};_proto2.
renderFolder=function renderFolder(value){var _PS$dragging7;
var room=this.props.room;
var cur=room.curFolder===value;
var children;
var folderOpenIcon=cur?'fa-folder-open':'fa-folder';
if(value.endsWith('/')){

children=[
preact.h("i",{"class":"fa "+folderOpenIcon+(value==='/'?'-o':'')}),
value.slice(0,-1)||'(uncategorized)'];

}else if(value===''){
children=[
preact.h("em",null,"(all)")];

}else if(value==='++'){
children=[
preact.h("i",{"class":"fa fa-plus","aria-hidden":true}),
preact.h("em",null,"(add folder)")];

}else{
children=[
preact.h("i",{"class":"fa "+folderOpenIcon+"-o"}),
value.slice(4)||'(uncategorized)'];

}





var active=((_PS$dragging7=PS.dragging)==null?void 0:_PS$dragging7.folder)===value?' active':'';
if(cur){
return preact.h("div",{
"class":"folder cur","data-value":value,
onDragEnter:this.dragEnterFolder,onDragLeave:this.dragLeaveFolder,onDrop:this.dropFolder},

preact.h("div",{"class":"folderhack3"},
preact.h("div",{"class":"folderhack1"}),preact.h("div",{"class":"folderhack2"}),
preact.h("button",{"class":"selectFolder"+active,"data-value":value},children)
)
);
}
return preact.h("div",{
"class":"folder","data-value":value,
onDragEnter:this.dragEnterFolder,onDragLeave:this.dragLeaveFolder,onDrop:this.dropFolder},

preact.h("button",{"class":"selectFolder"+active,"data-value":value},children)
);
};_proto2.
renderFolderList=function renderFolderList(){
var room=this.props.room;






var folderTable={'':1};
var folders=[];for(var _i2=0,_PS$teams$list2=
PS.teams.list;_i2<_PS$teams$list2.length;_i2++){var team=_PS$teams$list2[_i2];
var folder=team.folder;
if(folder&&!(folder+"/"in folderTable)){
folders.push(folder+"/");
folderTable[folder+"/"]=1;
if(!('/'in folderTable)){
folders.push('/');
folderTable['/']=1;
}
}

var format=team.format||room.DEFAULT_FORMAT;
if(!(format in folderTable)){
folders.push(format);
folderTable[format]=1;
}
}
if(room.curFolderKeep.endsWith('/')||room.curFolder.endsWith('/')){
if(!('/'in folderTable)){
folders.push('/');
folderTable['/']=1;
}
}
if(!(room.curFolderKeep in folderTable)){
folderTable[room.curFolderKeep]=1;
folders.push(room.curFolderKeep);
}
if(!(room.curFolder in folderTable)){
folderTable[room.curFolder]=1;
folders.push(room.curFolder);
}

PSUtils.sortBy(folders,function(folder){return[
folder.endsWith('/')?10:-parseInt(folder.charAt(3),10),
folder];}
);

var renderedFormatFolders=[
preact.h("div",{"class":"foldersep"}),
preact.h("div",{"class":"folder"},preact.h("button",{
name:"format",value:"","data-selecttype":"teambuilder",
"class":"selectFolder","data-href":"/formatdropdown",onChange:this.addFormatFolder},

preact.h("i",{"class":"fa fa-plus","aria-hidden":true}),preact.h("em",null,"(add format folder)")
))];


var renderedFolders=[];


var gen=-1;for(var _i4=0;_i4<
folders.length;_i4++){var _format=folders[_i4];
var newGen=_format.endsWith('/')?0:parseInt(_format.charAt(3),10);
if(gen!==newGen){
gen=newGen;
if(gen===0){
renderedFolders.push.apply(renderedFolders,renderedFormatFolders);
renderedFormatFolders=[];
renderedFolders.push(preact.h("div",{"class":"foldersep"}));
renderedFolders.push(preact.h("div",{"class":"folder"},preact.h("h3",null,"Folders")));
}else{
renderedFolders.push(preact.h("div",{"class":"folder"},preact.h("h3",null,"Gen ",gen)));
}
}
renderedFolders.push(this.renderFolder(_format));
}
renderedFolders.push.apply(renderedFolders,renderedFormatFolders);

return preact.h("div",{"class":"folderlist",onClick:this.selectFolder},
preact.h("div",{"class":"folderlistbefore"}),

this.renderFolder(''),
renderedFolders,
preact.h("div",{"class":"foldersep"}),
this.renderFolder('++'),

preact.h("div",{"class":"folderlistafter"})
);
};_proto2.

render=function render(){var _PS$dragging8,_this4=this;
var room=this.props.room;
var teams=PS.teams.list.slice();

var isDragging=false;
if(((_PS$dragging8=PS.dragging)==null?void 0:_PS$dragging8.type)==='team'&&typeof PS.dragging.team==='number'){
teams.splice(PS.dragging.team,0,null);
isDragging=true;
}else if(PS.teams.deletedTeams.length){
var undeleteIndex=PS.teams.deletedTeams[PS.teams.deletedTeams.length-1][1];
teams.splice(undeleteIndex,0,null);
}

var filterFolder=null;
var filterFormat=null;
if(room.curFolder){
if(room.curFolder.endsWith('/')){
filterFolder=room.curFolder.slice(0,-1);
teams=teams.filter(function(team){return!team||team.folder===filterFolder;});
}else{
filterFormat=room.curFolder;
teams=teams.filter(function(team){return!team||team.format===filterFormat;});
}
}

return preact.h(PSPanelWrapper,{room:room},
preact.h("div",{"class":"folderpane"},
this.renderFolderList()
),
preact.h("div",{"class":"teampane",onDrop:this.dropPanel},
filterFolder?
preact.h("h2",null,
preact.h("i",{"class":"fa fa-folder-open","aria-hidden":true})," ",filterFolder," ",
preact.h("button",{"class":"button small",style:"margin-left:5px",name:"renameFolder"},
preact.h("i",{"class":"fa fa-pencil","aria-hidden":true})," Rename"
)," ",
preact.h("button",{"class":"button small",style:"margin-left:5px",name:"promptDeleteFolder"},
preact.h("i",{"class":"fa fa-times","aria-hidden":true})," Remove"
)
):
filterFolder===''?
preact.h("h2",null,preact.h("i",{"class":"fa fa-folder-open-o","aria-hidden":true})," Teams not in any folders"):
filterFormat?
preact.h("h2",null,preact.h("i",{"class":"fa fa-folder-open-o","aria-hidden":true})," ",filterFormat," ",preact.h("small",null,"(",teams.length,")")):

preact.h("h2",null,"All Teams ",preact.h("small",null,"(",teams.length,")")),

preact.h("p",null,
preact.h("button",{"data-cmd":"/newteam","class":"button big"},preact.h("i",{"class":"fa fa-plus-circle","aria-hidden":true})," New Team")," ",
preact.h("button",{"data-cmd":"/newteam box","class":"button"},preact.h("i",{"class":"fa fa-archive","aria-hidden":true})," New Box")
),
preact.h("ul",{"class":"teamlist"},
teams.map(function(team){var _team$uploaded;return team?
preact.h("li",{key:team.key,onDragEnter:_this4.dragEnterTeam,"data-teamkey":team.key},
preact.h(TeamBox,{team:team})," ",
!team.uploaded&&preact.h("button",{"data-cmd":"/deleteteam "+team.key,"class":"option"},
preact.h("i",{"class":"fa fa-trash","aria-hidden":true})," Delete"
)," ",
(_team$uploaded=team.uploaded)!=null&&_team$uploaded["private"]?
preact.h("i",{"class":"fa fa-cloud gray"}):
team.uploaded?
preact.h("i",{"class":"fa fa-globe gray"}):
team.teamid?
preact.h("i",{"class":"fa fa-plug gray"}):

null

):
isDragging?
preact.h("li",{key:"dragging"},
preact.h("div",{"class":"team"})
):

preact.h("li",{key:"undelete"},
preact.h("button",{"data-cmd":"/undeleteteam","class":"option"},
preact.h("i",{"class":"fa fa-undo","aria-hidden":true})," Undo delete"
)
);}
)
),
preact.h("p",null,
preact.h("button",{"data-cmd":"/newteam bottom","class":"button"},preact.h("i",{"class":"fa fa-plus-circle","aria-hidden":true})," New Team")," ",
preact.h("button",{"data-cmd":"/newteam box bottom","class":"button"},preact.h("i",{"class":"fa fa-archive","aria-hidden":true})," New Box")
)
)
);
};return TeambuilderPanel;}(PSRoomPanel);TeambuilderPanel.id='teambuilder';TeambuilderPanel.routes=['teambuilder'];TeambuilderPanel.Model=TeambuilderRoom;TeambuilderPanel.icon=preact.h("i",{"class":"fa fa-pencil-square-o","aria-hidden":true});TeambuilderPanel.title='Teambuilder';


PS.addRoomType(TeambuilderPanel);
//# sourceMappingURL=panel-teambuilder.js.map