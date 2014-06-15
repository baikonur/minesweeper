/**
 * 素マインスイーパ
 * Date: 13/02/16
 */
enchant();

var SCREEN_WIDTH = 320;
var SCREEN_HEIGHT = 320;
var SZ = 9;
var BLOCKSZ = 32;
var ImageRatio = 2.0;
var gameStatus = "play";//"play" "gameover" "pause"
var touchStatus = "up";//up down
var _mouseX, _mouseY;
var matrix = new Array(SZ);
var viewField = new Array(SZ);
//var list_openPos = new Array();
var totalMines = Math.floor(SZ*SZ*0.13);
var numOpen = 0;
var timeStart = 0, timeEnd = 0, timeClear;
var clearText;
var timerId = -1;
var flags = new Array();

//ショートネーム => ファイルパス 変換テーブル
var ImgDr = 'images/';
var imageSymLink = {
    'digit': ImgDr+'digit.png'
    ,'puzzle': ImgDr+'puzzle.png'
    ,'flag': ImgDr+'icon_flag1_01.gif'
    ,'btn': ImgDr+'btn.png'
};
function trace(dbg){ console.log(dbg); }

/**
 *  Entry Point
 */
window.onload = function() {
    world_width = SCREEN_WIDTH;
    world_height = SCREEN_HEIGHT;
    game = new Game(world_width, world_height);
    game.fps = 24;
    game.preload(imageSymLink['digit'],
        imageSymLink['puzzle'],
        imageSymLink['btn'],
        imageSymLink['flag']);
    game.onload = function(){
        InitGame();
    };
    game.start();

};

/**
 *  画像Image取得
 *  @tag : ショートネーム
 */
function getImage(tag){
    return game.assets[ imageSymLink[tag] ];
}

var btnGroup;
function initUI(){
    game.rootScene.backgroundColor = '#f0f0f0';

    textBox = createText(4,(SZ)*BLOCKSZ+8,"○長押しで旗をたてる","#0044FF");
    game.rootScene.addChild(textBox);
    textBox2 = createText(SCREEN_WIDTH-218-4,(SZ)*BLOCKSZ+8,"爆発物="+totalMines,"#FF0000");
    textBox2.textAlign = 'right';
    textBox2.width = 218;
    game.rootScene.addChild(textBox2);


    btnGroup = new Group();
    game.rootScene.addChild(btnGroup);

    retryBtn = createText(0,(SZ)*BLOCKSZ+4,"[もう一回あそぶ]","#000000");
    retryBtn.textAlign = 'center';
    retryBtn.font = "18px Sans";
    retryBtn.width = SCREEN_WIDTH-BLOCKSZ;
    btnGroup.addChild(retryBtn);

    var btn =  new Sprite(160,32);
    btn.image = getImage('btn');
    btn.x = 160-80;
    btn.y = SCREEN_HEIGHT-BLOCKSZ;
    btn.opacity = 0.1;
    btnGroup.addChild(btn);
    btn.addEventListener(Event.TOUCH_END, function(e) {
        if(gameStatus == "gameover"){
            clearData();
            textBox.visible = true;
            btnGroup.y = BLOCKSZ;
        }
    });
    btnGroup.y = BLOCKSZ;
}

function createText(tx, ty, text, col){
    var tf = new Label();
    tf.color = col;
    tf.text = text;
    tf.x = tx;
    tf.y = ty;
    return tf;
}

/*
 * 初期化
 */
function SetFieldMap(ngL, ngC){
    function makeAllpatternRandSortList(lmax, cmax){
        var lst = new Array();
        var id = 0;
        for(var i = 0; i < lmax; i++){
            for(var j = 0; j < cmax; j++){
                lst.push({index:id, l:i, c:j, r:Math.random()});
                id++;
            }
        }
        lst.sort(function(a, b){ return (a.r > b.r)? 1:-1;});
        return lst;
    }
    function put2dArray(pf){
        if(pf == undefined){
            pf = viewField;
        }
        pf.forEach(function(p){
            trace(p.toString());
        });
        console.log(" ");
    }
    //周囲を見て爆弾の数を算出
    function makeNumber(col, line){
        var ptn = [
            -1,-1, 0,-1, 1,-1,
            -1,0, 1,0,
            -1,1, 0,1, 1,1
        ];
        var point = 0;
        for(var i = 0; i <= 14; i+=2){
            var ac = ptn[i];
            var al = ptn[i+1];
            var c = col + ac;
            var l = line + al;
            if(c < 0 || c >= SZ || l < 0 || l >= SZ){
                continue;
            }
            if(matrix[l][c] == '9'){
                point++;
            }
        }
        //console.log("number="+point);
        return point;
    }

    var tryn = 0;
    do{
        clearData();
        var rndIndex = makeAllpatternRandSortList(SZ,SZ);
        rndIndex = rndIndex.filter(function(p){return !(p.l == ngL && p.c == ngC);});//クリック位置除外
        totalMines = Math.floor(SZ*SZ*0.13);
        for(var i = 0; i < totalMines; i++){
            var p = rndIndex[i];
            matrix[p.l][p.c] = '9';
        }
    //put2dArray(matrix);
    //put2dArray();
        var goukaku = false;
        for(var l = 0; l < SZ; l++){
            //console.log(matrix[l]);
            var strline = "";
            for(var c = 0; c < SZ; c++ ){
                if(matrix[l][c] == '9'){
                    strline += "@";
                }else{
                    var num = makeNumber(c, l);
                    if(num >= 3) { goukaku = true; }//3以上がないものは不合格
                    strline += String(num);
                    matrix[l][c] = String(num);
                }
            }
            trace(strline);
        }
        //put2dArray(matrix);

    }while(++tryn < 100 && !goukaku);
trace("try "+tryn);

    viewCtrl.update(viewField);

}

function addEvents(){
    game.rootScene.addEventListener(Event.TOUCH_START, function(e) {
        _onTouchStart(e.localX, e.localY);
    });
    game.rootScene.addEventListener(Event.TOUCH_MOVE, function(e) {
        _mouseX = e.localX;
        _mouseY = e.localY;
    });
    game.rootScene.addEventListener(Event.TOUCH_END, function(e) {
        _onTouchEnd(e.localX, e.localY);
    });
}

var titleGamen;
function InitGame(){

    viewCtrl = new DisplayField();
    flagMgr = new FlagManager();
    clearData();
    //addEvents();
    initUI();

    var aGrp = new Group();
    titleGamen = new Sprite(SCREEN_WIDTH, SCREEN_HEIGHT);
    titleGamen.image = new Surface(SCREEN_WIDTH, SCREEN_HEIGHT);
    titleGamen.image.context.beginPath();
    titleGamen.image.context.fillStyle = "rgba(255, 255, 0, 0.9)";
    titleGamen.image.context.fillRect(0, 100, SZ*BLOCKSZ, SCREEN_HEIGHT/3);
    //game.rootScene.addEventListener(Event.TOUCH_END, function(e) {
    //    game.rootScene.removeChild(aGrp);
    //    addEvents();
    //});
    game.rootScene.onenter = function(){
        game.rootScene.removeChild(aGrp);
        addEvents();
    };
    aGrp.addChild(titleGamen);
    game.rootScene.addChild(aGrp);
    var txt1 = createText(0,128,"素マインスイーパ","#000000");
    txt1.textAlign = 'center';
    txt1.font = "italic bold 24px Sans";
    txt1.width = SZ*BLOCKSZ;
    aGrp.addChild(txt1);
    var txt2 = createText(0,172,"クリックでスタート","#ff0000");
    txt2.textAlign = 'center';
    txt2.font = "18px Sans";
    txt2.width = SZ*BLOCKSZ;
    aGrp.addChild(txt2);

    docan = new Group();
    var gameOverBox = new Sprite(SCREEN_WIDTH, SCREEN_HEIGHT);
    gameOverBox.image = new Surface(SCREEN_WIDTH, SCREEN_HEIGHT);
    gameOverBox.image.context.beginPath();
    gameOverBox.image.context.fillStyle = "rgba(255, 0, 0, 0.9)";
    gameOverBox.image.context.fillRect(0, 100, SZ*BLOCKSZ, SCREEN_HEIGHT/3);
    //docan.addEventListener(Event.TOUCH_END, function(e) {
    //    docan.x = SCREEN_WIDTH;
    //    retryBtn.visible = true;
    //});
    docan.addChild(gameOverBox);
    docan.x = SCREEN_WIDTH;
    var txtd = createText(0,132,"どかーーーーーん！！","#ffffff");
    txtd.textAlign = 'center';
    txtd.font = "bold 24px Sans";
    txtd.width = SZ*BLOCKSZ;
    docan.addChild(txtd);
    game.rootScene.addChild(docan);

    missionClear = new Group();
    var clearBox = new Sprite(SCREEN_WIDTH, SCREEN_HEIGHT);
    clearBox.image = new Surface(SCREEN_WIDTH, SCREEN_HEIGHT);
    clearBox.image.context.beginPath();
    clearBox.image.context.fillStyle = "rgba(0, 80, 255, 0.9)";
    clearBox.image.context.fillRect(0, 100, SZ*BLOCKSZ, SCREEN_HEIGHT/3);
    //missionClear.addEventListener(Event.TOUCH_END, function(e) {
    //    missionClear.x = SCREEN_WIDTH;
    //    retryBtn.visible = true;
    //});
    missionClear.addChild(clearBox);
    missionClear.x = SCREEN_WIDTH;
    var txtc = createText(0,124,"クリアおめでとう！","#ffffff");
    txtc.textAlign = 'center';
    txtc.font = "bold 24px Sans";
    txtc.width = SZ*BLOCKSZ;
    missionClear.addChild(txtc);
    clearText = createText(0,158,"time=","#ffffff");
    clearText.textAlign = 'center';
    clearText.font = "16px Sans";
    clearText.width = SZ*BLOCKSZ;
    missionClear.addChild(clearText);
    game.rootScene.addChild(missionClear);
}

//ミッション失敗
function doGameOver(){
    docan.x = 0;
    //alert("どかーーーーーーーん!");
    gameStatus = "gameover";
    viewCtrl.giveup(matrix);
    textBox.visible = false;
    game.rootScene.addEventListener(Event.TOUCH_END, function(e) {
        docan.x = SCREEN_WIDTH;
        btnGroup.y = 0;
        game.rootScene.removeEventListener(Event.TOUCH_END, arguments.callee);
    });
}

//ミッション成功
function doGameClear(){
    missionClear.x = 0;
    timeEnd = new Date().getTime();
    var clearTime = (timeEnd - timeStart);
    //alert("Game Clear!!! "+clearTime+"秒");
    sweepcost = Math.floor(clearTime * (flagMgr.useCount+1));
    var strMsg = "地雷除去にかかったお金："+sweepcost+"円";
    clearText.text = strMsg;
    gameStatus = "gameover";
    viewCtrl.giveup(matrix);
    //retryBtn.visible = true;
    textBox.visible = false;
    game.rootScene.addEventListener(Event.TOUCH_END, function(e) {
        missionClear.x = SCREEN_WIDTH;
        btnGroup.y = 0;
        game.rootScene.removeEventListener(Event.TOUCH_END, arguments.callee);
        if(location.hostname != "" || clearTime>60*10*1000){
            game.end(600000-sweepcost, strMsg);
        }
    });
}

function clearData(){
    flagMgr.allOff();
    for(var i  = 0; i < SZ; i++){
        matrix[i] = new Array(SZ);
        viewField[i] = new Array(SZ);
        for(var j  = 0; j < SZ; j++){
            matrix[i][j] = "0";
            viewField[i][j] = "#";
        }
    }
    gameStatus = "play";
    numOpen = 0;
    viewCtrl.update(viewField);
    timerId = -1;
}

/*
 * 開く
 */
function punch(l, c, v){
    if(v == undefined){
        v = "0";
    }
    if(viewField[l][c] == v) return;
    viewField[l][c] = v;
    //console.log("punch "+v);
    //list_openPos.push({l:l, c:c});
    numOpen++;
    //trace(numOpen);
}

//Open sight
function opensight(line, col){//:String
    var ClockwisePtn = [
        -1,-1, 0,-1, 1,-1,
        -1,0, 1,0,
        -1,1, 0,1, 1,1
    ];
    var theNumber = viewField[line][col];
    theNumber = matrix[line][col];
    punch(line, col, theNumber);
    if(theNumber != "0"){
        return theNumber;//9ならゲームオーバーやね
    }
    var point = 0;
    for(var i = 0; i <= 14; i+=2){
        var ac = ClockwisePtn[i];
        var al = ClockwisePtn[i+1];
        var c = col + ac;
        var l = line + al;
        if(c < 0 || c >= SZ || l < 0 || l >= SZ){
            continue;
        }
        if(viewField[l][c] != "#") {
            continue;
        }
        var disp = matrix[l][c];
        if(disp == "9"){
            continue;
        }else{
            punch(l, c, disp);
            if(disp == "0"){
                opensight(l, c);
            }
        }
    }
    return theNumber;
}

var nagaoshiL, nagaoshiC;
function _onTouchStart(px, py){
    var posL = Math.floor(py / BLOCKSZ);
    var posC = Math.floor(px / BLOCKSZ);
    if(posL >= SZ || posC >= SZ){
        return;
    }
    if(gameStatus == "play"){
        if(numOpen == 0) {
            touchStatus = "down";
            return;
        }
        if(touchStatus == "up"){
            timeTouchStart = new Date().getTime();
            touchStatus = "down";
            trace("s"+timeTouchStart);

                nagaoshiL = posL;
                nagaoshiC = posC;
                timerId = setTimeout(_touchTimerCb, NAGAOSHI_MSEC);
        }
    }
}

function _touchTimerCb(){
    clearTimeout(timerId);
    timerId = -1;
    if(gameStatus == "play"){
        touchStatus = "up";
        flagMgr.switchFlag(nagaoshiL, nagaoshiC);
    }
}

var NAGAOSHI_MSEC = 500;
function _onTouchEnd(px, py){

    if(timerId >= 0) {
        clearTimeout(timerId);
        timerId = -1;
    }
    var posL = Math.floor(py / BLOCKSZ);
    var posC = Math.floor(px / BLOCKSZ);
    if(posL >= SZ || posC >= SZ){
        return;
    }
    if(gameStatus == "play"){
        //trace(posL +","+ posC);

        if(numOpen == 0){//ゲームスタート
            timeStart = new Date().getTime();
            SetFieldMap(posL, posC);//最初の位置が爆弾にならないよう配慮
        }else{
            if(touchStatus == "down"){
                var ddur = (new Date().getTime()) - timeTouchStart;
                trace("d"+ddur);
                if(ddur >= NAGAOSHI_MSEC){//長押しで旗たてる
                    touchStatus = "up";
                    flagMgr.switchFlag(posL,posC);
                    return;
                }else{
                }
            }
        }

        if(flagMgr.isFlag(posL,posC) || touchStatus == "up"){
            return;
        }
        touchStatus = "up";
        var res = opensight(posL, posC);
        viewCtrl.update(viewField);
        if(res == "9"){
            /*
            docan.x = 0;
            //alert("どかーーーーーーーん!");
            gameStatus = "gameover"
            viewCtrl.giveup(matrix);
            //retryBtn.visible = true;
            textBox.visible = false;
            */
            doGameOver();
        }else{
            if(numOpen == SZ*SZ-totalMines){
                doGameClear();
            }
        }
    }
}


/////////////////////////////////////////////////////////////////////////
//表示クラス
DisplayField = enchant.Class.create({
    initialize: function() {

        var sz = SZ * BLOCKSZ;
        sprGage = new Sprite(sz, sz);
        sprGage.image = new Surface(sz, sz);
        var cc = sprGage;
        cc.image.context.beginPath();
        cc.image.context.fillStyle = "#888888";
        cc.image.context.fillRect(0, 0, sz, sz);
        for(var i = 0; i < SZ; i++){
            for(var j = 0; j < SZ; j += 2){
                cc.image.context.fillStyle = "#9c9c9c";
                cc.image.context.fillRect(j*BLOCKSZ+(i%2)*BLOCKSZ, i*BLOCKSZ, BLOCKSZ, BLOCKSZ);
            }
        }
        game.rootScene.addChild(sprGage);

        this.mcBox = new Array(SZ);
        this.mcNum = new Array(SZ);
        for(var l = 0; l < SZ; l++){
            this.mcBox[l] = new Array(SZ);
            this.mcNum[l] = new Array(SZ);
            for(var c = 0; c < SZ; c++){
                var xpos = c * BLOCKSZ;
                var ypos = l * BLOCKSZ;
                var mc =  new Sprite(BLOCKSZ/ImageRatio, BLOCKSZ/ImageRatio);
                mc.image = getImage('puzzle');
                mc.scaleX = ImageRatio;
                mc.scaleY = ImageRatio;
                mc.frame = 14;//14 -
                mc.x = xpos+8;
                mc.y = ypos+8;
                game.rootScene.addChild(mc);
                this.mcBox[l][c] = mc;

                var mc2 =  new Sprite(BLOCKSZ, BLOCKSZ);
                mc2.image = getImage('digit');
                mc2.frame = 0;//17 -
                mc2.x = xpos;
                mc2.y = ypos;
                game.rootScene.addChild(mc2);
                this.mcNum[l][c] = mc2;

            }
        }
    },

    update: function(map){
        for(var l = 0; l < SZ; l++){
            for(var c = 0; c < SZ; c++){
                this.mcBox[l][c].opacity = 1;
                switch(map[l][c]){
                    case "#":
                        this.mcBox[l][c].visible = true;
                        this.mcBox[l][c].frame = 14;
                        this.mcNum[l][c].frame = 0;
                        break;
                    case "9":
                        this.mcBox[l][c].frame = 0;
                        this.mcNum[l][c].frame = 0;
                        break;
                    case "0":
                        this.mcBox[l][c].visible = false;
                        this.mcNum[l][c].visible = false;
                        break;
                    default:
                        this.mcBox[l][c].visible = false;
                        this.mcNum[l][c].visible = true;
                        this.mcNum[l][c].frame =  1 + parseInt(map[l][c], 10);
                }
            }
        }
    },

    giveup: function(map){
        for(var l = 0; l < SZ; l++){
            for(var c = 0; c < SZ; c++){
                this.mcBox[l][c].opacity = 0.5;
                if(map[l][c] == "9"){
                    this.mcBox[l][c].frame = 0;
                    this.mcNum[l][c].frame = 0;
                }
            }
        }
    }
});
/////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////////////////
//旗管理
FlagManager = enchant.Class.create({
    initialize: function() {
        this.flagLayer = new Group();
        game.rootScene.addChild(this.flagLayer);
        this.useCount = 0;
        this.flags = new Array(SZ);
        for(var i = 0; i < SZ; i++){
            this.flags[i] = new Array(SZ);
            for(var j = 0; j < SZ; j++){
                this.flags[i][j] = 0;
            }
        }
    },

    switchFlag: function(l, c){
        this.flags[l][c] ^= 1;
        var tag = "flgimg_"+l+"_"+c;
        if(tag in this){
            this[tag].visible = (this.flags[l][c] == 1);
        }else{
            var mc =  new Sprite(32,32);
            mc.image = getImage('flag');
            mc.x = c * BLOCKSZ;
            mc.y = l * BLOCKSZ;
            this.flagLayer.addChild(mc);
            this[tag] = mc;
        }
        this.useCount += this.flags[l][c];
    },

    isFlag: function(l, c){
        return (this.flags[l][c] == 1);
    },

    update: function(){
    },

    allOff: function(){
        for(var i = 0; i < SZ; i++){
            for(var j = 0; j < SZ; j++){
                if(this.flags[i][j]){
                    this.flags[i][j] = 0;
                    var tag = "flgimg_"+i+"_"+j;
                    this[tag].visible = false;
                }
            }
        }
        this.useCount = 0;
    }

});
