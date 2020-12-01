"use strict";

(() => {
  ////////////////////////
  //ゲームスタートの管理//
  ////////////////////////
  let isPlaying = false;//ゲーム実行状況、初期値はfalse
  let levelRow;         //ゲームレベル、最初は空（プレーヤーが設定）
  let requestId;        //後述する再描画処理を格納するId

  ///////
  //DOM//
  ///////
  const beginner = document.getElementById("beginner");
  const intermediate = document.getElementById("intermediate");
  const advanced = document.getElementById("advanced");
  const canvas = document.getElementById("canvas");
  const reset = document.getElementById("reset");
  
  ////////////////
  //canvasの生成//
  ////////////////
  if(typeof canvas.getContext === "undefined"){
    return;
  }
  const ctx = canvas.getContext("2d"); //キャンバス用のメソッドを取得
  // canvas.width = 500;                  //canvasの幅
  // canvas.height = canvas.width * 0.8;  //canvasの高さ
  canvas.setAttribute (
    "style",
    "display:block; margin:0 auto; background-color:#eee"
  );//canvasのスタイル


  ////////////////////
  //動くボールの描写//
  ////////////////////
  const ball = {
    x: null,
    y: null,
    width: 6,
    height: 6,
    speed: 4,
    dx: 1,
    dy: 5,
    update: function () {
      ctx.beginPath();
      ctx.fillStyle ="blue";
      ctx.arc(this.x, this.y, this.width ,0 ,Math.PI *2 ,false);
      ctx.fill();
      ctx.closePath();
      if (this.x < 0 || this.x > canvas.width) {
        this.dx *= -1;
      }
      if (this.y < 0 || this.y > canvas.height) {
        this.dy *= -1;
      }
      // if (this.y > canvas.height) {
      //   // window.cancelAnimationFrame(requestId);
      //   isPlaying = false;
      //   gameOver();
      // }
      ball.x += this.dx;
      ball.y += this.dy;
    },
  };


  //////////////////////////////
  //自分で操作するパドルの描写//
  //////////////////////////////
  const paddle = {
    x: null,
    y: null,
    width: 100,
    height: 12,
    speed: 0,
    update: function () {
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fillStyle = "green";
      ctx.fill();
      this.x += this.speed;
    },
  };


  //////////////////
  //ブロックの作成//
  //////////////////
  const block = {
    width: null,
    height: 20,
    data: [],
    update: function () {
      this.data.forEach( (brick) => {
        ctx.strokeStyle = "#555";
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        ctx.stroke();
      });
    },
  };

  /////////////////////////////////////////////
  //ブロックの配置場所を配列で取得（7行×6列）//
  /////////////////////////////////////////////
  const blockLevel = [
    [0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1],
  ];

  //パドル・ボール・ボールの移動速度・ブロックの初期位置を決める関数を用意
  const init = (levelRow) => {
    //////////////////
    //パドル初期位置//
    //////////////////
    paddle.x = canvas.width / 2 - paddle.width / 2;
    paddle.y = canvas.height - paddle.height;

    //////////////////
    //ボール初期位置//
    //////////////////
    ball.x = canvas.width / 4;
    ball.y = canvas.height / 2 - 30;
    ball.dx = ball.speed;
    ball.dy = ball.speed;

    ////////////////
    //ブロックの幅//
    ////////////////
    block.width = canvas.width / blockLevel[0].length;

    //////////////////
    //ブロックの描画//
    //////////////////
    for (let i = 0; i < levelRow + 1; i++) {
      for (let j = 0; j < blockLevel[i].length; j++) {
        if (blockLevel[i][j]) {
          block.data.push({
            x: block.width * j,
            y: block.height * i,
            width: block.width,
            height: block.height,
          });
        }
      }
    }
  };

  ////////////////////////////////////////
  //         ボールの当たり判定         //
  //(obj1にball、obj2にpaddleを後で格納)//
  ////////////////////////////////////////
  const collide = (obj1, obj2) => {
    return (
      obj1.x < obj2.x + obj2.width && //ballのx座標がpaddleのx座標+幅より小さい(左側)
      obj2.x < obj1.x + obj1.width && //ballの幅+x座標がpaddleのx座標(左端)より大きい（右側）
      obj1.y < obj2.y + obj2.height &&//ballのy座標がpaddleのy座標+幅より小さい（上側）
      obj2.y < obj1.y + obj1.height   //ballの高さ+y座標がpaddleのy座標より大きい（下側）
    );//返却するのはtrueかfalse。trueの場合、ballのxy座標がpaddleのxy座標内部に入った時
  };

  ////////////////////////
  //メインの繰り返し処理//
  ////////////////////////
  function loop() {
    ////////////////////////////////
    //指定範囲の描画のリセット処理//
    ////////////////////////////////
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paddle.update(); //パドルの再描画
    ball.update();   //ボールの再描画
    block.update();  //ブロックの再描画

    //////////////////////////////////////////////////////
    //ボールとブロックが接触したら、ボールを反射する挙動//
    //////////////////////////////////////////////////////
    if (collide(ball, paddle)) {
      ball.dy *= -1;
      //ボールがパドルの中に入らない挙動//
      ball.y = paddle.y - ball.height;
    }

    //////////////////////////////////////////
    //接触したブロックを除き、再配列する処理//
    //////////////////////////////////////////
    block.data.forEach((brick, index) => {
      if (collide (ball, brick) ) {
        ball.dy *= -1;
        block.data.splice(index, 1);
      }
      if( block.data.length === 0 ){
        block.data.splice(index, 1);
        alert("ゲームクリアです！");
        confirm("ゲームを再開しますか？");
      }
    });
    ////////////////////////////////////////////////
    //ブラウザの適切なタイミングで再描画処理を実行//
    ////////////////////////////////////////////////
    requestId = window.requestAnimationFrame(loop); 
  };


  ////////////////////////
  //キー操作時のイベント//
  ////////////////////////
  document.addEventListener("keydown", (e) => {
    if(paddle.x <= 0) {
      paddle.x = 0;
      paddle.speed = 0;
      if (e.key === "ArrowRight") {
        paddle.speed = 6;
      }
    } else {
      if (e.key === "ArrowLeft") {
        paddle.speed = -6;
      }
    }
    if (paddle.x + paddle.width >= canvas.width) {
      paddle.x = canvas.width - paddle.width;
      paddle.speed = 0;
      if (e.key === "ArrowLeft") {
        paddle.speed = -6;
      }
    } else {
      if (e.key === "ArrowRight") {
        paddle.speed = 6;
      }
    }
  });

  ////////////////////////////
  //キーを離した時のイベント//
  ////////////////////////////
  document.addEventListener("keyup", () => {
    paddle.speed = 0;
  });

  //////////////////////
  /////スタート処理/////
  //////////////////////
  function gameStart(){      
      if (isPlaying === true) {
        return;
      }
      isPlaying = true;//ゲームの状態管理
      init(levelRow);  //パドル位置の初期化関数を実行
      loop();          //画像を再描画する関数の実行
  }

  ////////////////////
  //ゲーム終了の関数//
  ////////////////////
  function gameOver() {
    isPlaying = false;
    window.alert("GameOver");
    if(confirm("ゲームを再開しますか")) {
      requestId = 0;
      startFlag();
      init(levelRow); //パドル位置の初期化関数を実行
      isPlaying = true;
    } else {
      alert("お疲れ様でした！画面を閉じてください。");
    }
  };

  //////////////////////
  //ゲームクリアの関数//
  //////////////////////
  function gameClear(){
    // window.cancelAnimationFrame(requestId);
    alert("ゲームクリアです！");
    if(window.confirm("ゲームを再開しますか？")){
    }else{
    }
    init();
  }

  ////////////////////
  //ゲーム難易度選択//
  ////////////////////
  beginner.addEventListener("click" , () => {
    if(isPlaying ===true){
      return;
    }
    if(window.confirm("初級レベルでゲームを開始しますか？")){
      levelRow = 2;
      gameStart();
    } else {
      return;
    }
  });
  intermediate.addEventListener("click" , () => {
    if(isPlaying === true){
      return;
    }
    if(window.confirm("中級レベルでゲームを開始しますか？")){
      levelRow = 5;
      gameStart();
    } else {
      return;
    }
  });
  advanced.addEventListener("click" , () => {
    if(isPlaying === true){
      return;
    }
    if(window.confirm("上級レベルでゲームを開始しますか？")){
      levelRow = 8;
      gameStart();
    } else {
      return;
    }
  });

  reset.addEventListener("click" , () => {
    if(isPlaying === false){
      return;
    }
    if(window.confirm("ゲームを中止しますか？")){
      isPlaying = false;
      cancelAnimationFrame(requestId);
    } else {
      console.log("ゲームを再開します");
    }
  });
})();