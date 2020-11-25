"use strict";

{
  ////////////////////////
  //ゲームスタートの管理//
  ////////////////////////
  let isPlaying = false;//ゲーム実行状況、初期値はfalse
  let levelRow;//ゲームレベル、最初は空（後でプレーヤーに入力してもらう）

  ////////////////
  //canvasの生成//
  ////////////////
  const canvas = document.createElement("canvas");//<canvas></canvas>の生成（生成のみ）
  const ctx = canvas.getContext("2d"); //キャンバス用のメソッドを取得
  canvas.width = 500; //canvasの幅
  canvas.height = canvas.width * 0.8; //canvasの高さ
  canvas.setAttribute (
    "style",
    "display:block; margin:0 auto; background-color:#eee"
  ); //canvasのスタイル
  document.body.appendChild(canvas); //canvasをbodyの直下に配置


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
      if (this.y > canvas.height) {
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
    height: 12,
    speed: 0,
    update: function () {
      ctx.fillStyle = "green";
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

  //////////////////////
  //ボールの当たり判定//
  //////////////////////
  const collide = (obj1, obj2) => {
    return (
      obj1.x < obj2.x + obj2.width &&
      obj2.x < obj1.x + obj1.width &&
      obj1.y < obj2.y + obj2.height &&
      obj2.y < obj1.y + obj1.height
    );
  };

  ////////////////////////
  //メインの繰り返し処理//
  ////////////////////////
  const loop = () => {
    ////////////////////////////////
    //指定範囲の描画のリセット処理//
    ////////////////////////////////
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paddle.update(); //パドルの再描画
    ball.update(); //ボールの再描画
    block.update(); //ブロックの再描画

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
      if (collide(ball, brick)) {
        ball.dy *= -1;
        block.data.splice(index, 1);
      }
      if(block.data.length === 0){
        alert("ゲームクリアです！");
        confirm("ゲームを再開しますか？");
      }
    });
    
    ////////////////////////////////////////////////
    //ブラウザの適切なタイミングで再描画処理を実行//
    ////////////////////////////////////////////////
    window.requestAnimationFrame(loop); 
    console.log(ball.dx , ball.dy);
  };

  ////////////////////////
  //キー操作時のイベント//
  ////////////////////////
  document.addEventListener("keydown", (e) => {
    if(paddle.x <= 0) {
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

  
  function startFlag() {
    levelRow = parseInt(
      window.prompt("難易度を1〜7で選択してください", "7")
      );
      if (typeof levelRow !== "number") {
        console.log("数字を入力してください");
      }
    }
    

  //////////////////////
  /////スタート処理/////
  //////////////////////
  document.addEventListener("click", () => {
    if (isPlaying === true) {
      return;
    }
    startFlag();
    isPlaying = true;
    init(levelRow); //パドル位置の初期化関数を実行
    loop(); //画像を再描画する関数の実行
  });

  ////////////////////
  //ゲーム終了の関数//
  ////////////////////
  function gameOver() {
    window.alert("GameOver");
    if(confirm("ゲームを再開しますか")) {
      isPlaying = true;
      startFlag();
      init(levelRow); //パドル位置の初期化関数を実行
      loop(); //画像を再描画する関数の実行
    } else {
      alert("お疲れ様でした！画面を閉じてください。")
      isPlaying = false;
    }
  };

  //////////////////////
  //ゲームクリアの関数//
  //////////////////////
  function gameClear(){
    init();
  }
}