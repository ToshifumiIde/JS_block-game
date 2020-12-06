"use strict";

(() => {
  ////////////////////////
  //ゲームスタートの管理//
  ////////////////////////
  let isFinished = false;
  let isGameOver = false;
  let isPlaying = false;
  let levelRow;//ゲームレベル
  let level;

  ///////
  //DOM//
  ///////
  const canvas = document.getElementById("canvas");
  const close = document.getElementById("close");
  const mask = document.getElementById("mask");
  const finished = document.getElementById("finished");
  const finishedMessage1 = document.getElementById("finishedMessage1");
  const finishedMessage2 = document.getElementById("finishedMessage2");
  const beginner = document.getElementById("beginner");
  const advanced = document.getElementById("advanced");
  const intermediate = document.getElementById("intermediate");

  ////////////////
  //canvasの生成//
  ////////////////
  if(typeof canvas.getContext === "undefined"){
    return;
  }
  const ctx = canvas.getContext("2d");
  canvas.setAttribute (
    "style",
    "display:block; margin:0 auto; background-color:#efefef"
  );


  function rand(min ,max){
    return Math.random() * (max - min) + min;
  };

  ////////////////////
  //動くボールの描写//
  ////////////////////
  const ball = {
    x: null,
    y: null,
    width: 10,
    height: 10,
    r:10,
    dx: rand(3,5) * ( Math.random() < 0.5 ? 1 : -1),
    dy: rand(3,5) * ( Math.random() < 0.4 ? 1 : -1),
    update: function () {
      ctx.beginPath();
      ctx.fillStyle ="rgb(107, 178, 255)";
      ctx.arc(this.x, this.y, this.r , 0 ,Math.PI*2);
      ctx.fill();
      ctx.closePath();
      if (
        this.x - this.r < 0 || 
        this.x + this.r > canvas.width
        ) {
        this.dx *= -1;
      }
      if (
        this.y - this.r < 0 
        // || this.y + this.r > canvas.height //テスト段階での反射処理
        ) {
        this.dy *= -1;
      }
      if (this.y + this.r > canvas.height) {
        isPlaying = false;
        gameOver();
      }
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
    height: 20,
    speed: 0,
    update: function () {
      ctx.fillStyle = "rgb(107, 178, 255)";
      ctx.fillRect(this.x, this.y, this.width, this.height);
      ctx.fill();
      this.x += this.speed;
    },
  };


  //////////////////
  //ブロックの作成//
  //////////////////
  const block = {
    width: null,
    height: 12,
    data: [],
    update: function () {
      this.data.forEach( (brick) => {
        ctx.lineWidth = 0.5;
        ctx.strokeStyle =  "rgb(3, 133, 255)";
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
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2 -30;
    ball.dx = ball.dx;
    ball.dy = ball.dy;

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
      obj1.x + obj1.width > obj2.x && //ballの幅+x座標がpaddleのx座標(左端)より大きい（右側）
      obj1.y < obj2.y + obj2.height &&//ballのy座標がpaddleのy座標+幅より小さい（上側）
      obj1.y + obj1.height > obj2.y   //ballの高さ+y座標がpaddleのy座標より大きい（下側）
    );//返却するのはtrueかfalse。trueの場合、ballのxy座標がpaddleのxy座標内部に入った時
  };
  const collide2 = (obj1, obj2) => {
    return (
      obj1.x - obj1.r < obj2.x + obj2.width && 
      obj1.x + obj1.r > obj2.x && 
      obj1.y - obj1.r < obj2.y + obj2.height &&
      obj1.y + obj1.r > obj2.y 
      );
  };
      

  ////////////////////////
  //メインの繰り返し処理//
  ////////////////////////
  function loop() {
    if(isGameOver || isFinished){
      return;
    };

    ////////////////////////////////
    //指定範囲の描画のリセット処理//
    ////////////////////////////////
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    block.update();  //ブロックの再描画
    paddle.update(); //パドルの再描画
    ball.update();   //ボールの再描画

    //////////////////////////////////////////////////////
    //ボールとブロックが接触したら、ボールを反射する挙動//
    //////////////////////////////////////////////////////
    if (collide(ball, paddle)) {
      ball.dy *= -1;
      //ボールがパドルの中に入らない挙動//
      ball.y = paddle.y - ball.height;
    }
    
    //////////////////////////////////////////////////////////////
    //ボールとブロックが接触したら、ブロックを除き再配列する処理//
    //////////////////////////////////////////////////////////////
    block.data.forEach((brick, index) => {
      if (collide2 (ball, brick) ) {
        ball.dy *= -1;
        // ball.y = brick.y - ball.height;
        block.data.splice(index, 1);
      }
      if( block.data.length === 0 ){
        gameClear();
      }
    });
    ////////////////////////////////////////////////
    //ブラウザの適切なタイミングで再描画処理を実行//
    ////////////////////////////////////////////////
    window.requestAnimationFrame(loop); 
  };


  ////////////////////////
  //キー操作時のイベント//
  ////////////////////////
  document.addEventListener("keydown", (e) => {
    if(paddle.x <= 0) {
      paddle.x = 0;
      paddle.speed = 0;
      if (e.key === "ArrowRight") {
        paddle.speed = 9;
      }
    } else {
      if (e.key === "ArrowLeft") {
        paddle.speed = -9;
      }
    }
    if (paddle.x + paddle.width >= canvas.width) {
      paddle.x = canvas.width - paddle.width;
      paddle.speed = 0;
      if (e.key === "ArrowLeft") {
        paddle.speed = -9;
      }
    } else {
      if (e.key === "ArrowRight") {
        paddle.speed = 9;
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
    if (isPlaying) {
      return;
    }
    reset();
    isPlaying = true;//ゲームの状態管理
    init(levelRow);  //パドル位置の初期化関数を実行
    loop();          //画像を再描画する関数の実行
  }

  ////////////////////
  //ゲーム終了の関数//
  ////////////////////
  function gameOver() {
    isPlaying = false;
    isGameOver = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paddle.update(); 
    finishedMessage1.textContent = "残念！";
    finishedMessage2.textContent = `${level}クリアならず！`;
    mask.classList.remove("hidden");
    finished.classList.remove("hidden");
  };
  
  //////////////////////
  //ゲームクリアの関数//
  //////////////////////
  function gameClear(){
    isPlaying = false;
    isFinished = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paddle.update(); 
    finishedMessage1.textContent = "おめでとう！！";
    finishedMessage2.textContent = `${level}をクリアしました！`;
    finished.classList.remove("hidden");
    mask.classList.remove("hidden");
  }

  ////////////////////
  //ゲーム難易度選択//
  ////////////////////
  beginner.addEventListener("click" , () => {
    if(isPlaying){
      return;
    }
    if(window.confirm("初級レベルでゲームを開始しますか？")){
      levelRow = 2;
      level = "初級"
      gameStart();
    } else {
      return;
    }
  });
  intermediate.addEventListener("click" , () => {
    if(isPlaying){
      return;
    }
    if(window.confirm("中級レベルでゲームを開始しますか？")){
      levelRow = 5;
      level = "中級"
      gameStart();
    } else {
      return;
    }
  });
  advanced.addEventListener("click" , () => {
    if(isPlaying){
      return;
    }
    if(window.confirm("上級レベルでゲームを開始しますか？")){
      levelRow = 7;
      level = "上級";
      reset();
      gameStart();
    } else {
      return;
    }
  });


  mask.addEventListener("click" , () =>{
    mask.classList.add("hidden");
    finished.classList.add("hidden");
    reset();
  });
  close.addEventListener("click" , () =>{
    mask.click();
    reset();
  });
  
  function reset(){
    isFinished = false;
    isGameOver = false;
    isPlaying = false;
  }

})();