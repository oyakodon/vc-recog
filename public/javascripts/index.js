  angular.module('myApp', [])
  .controller('MyController', ['$scope', '$http', '$timeout', '$document', '$window',
    function($scope, $http, $timeout, $document, $window) {
      $scope.log = "AngularJS 正常\n";
      $scope.chat = "";
      $scope.form_enabled = true;
      $scope.mic_anime_visible = false;
      $scope.mic_stop_visible = true;
      $scope.interimBtnDisabled = true;
      $scope.cancelBtnDisabled = true;
      
      var flag_speech = false;
      var flag_talking = false;
      var interimText = "";
      
      var socket;
      var peer;
      
      // 環境変更時、修正必須!
      var peerOptions = {
        host : "testpeerjs-oyakodon.c9users.io",
        path : '/',
        port : 8081,
        secure : true,
        key : 'peerjs',
        debug : 3
      };
      
      $scope.submitInterim = function() {
        $scope.interimBtnDisabled = true;
        $scope.cancelBtnDisabled = true;
        
        socket.emit("chat", interimText);
        vr();
      };
      
      $scope.cancel = function() {
        $scope.interimBtnDisabled = true;
        $scope.cancelBtnDisabled = true;
        
        vr();
      };
      
      // peerjs
      navigator.getUserMedia = ( $window.navigator.getUserMedia ||
                       $window.navigator.webkitGetUserMedia ||
                       $window.navigator.mozGetUserMedia ||
                       $window.navigator.msGetUserMedia );
      
      $scope.startCall = function() {
      
        if (navigator.getUserMedia) {
          // サポートしている
          
          // speechRecognition サポートチェック
          if ($window.webkitSpeechRecognition){
            $scope.log += "このブラウザは speechRecognition 対応\n";
            
            vr();
            
          } else {
            $scope.log += "このブラウザは speechRecognition 非対応\n";
            
          }
          
          $scope.log += "getUserMedia 対応\n";
          $scope.form_enabled = false;
          
          var members = {};
          
          navigator.getUserMedia({ audio: true }, function (stream) {
            socket = io();
            
            socket.on('connect', function () {
              var name = $scope.name;
              
              console.log("socket.id: ", socket.id);
              console.log("Name: ", name);
              $scope.log += "ID: " + socket.id + "\n";
              $scope.log += "Name: " + name + "\n";
              $scope.$apply();
              
              socket.emit("connected", name);
              
              peer = new Peer(socket.id, peerOptions);
              
              if (peer.id == null) {
                console.log('Cannot connect PeerServer.');
                $scope.log += "Peerサーバに接続できませんでした。\n";
                $scope.$apply();
              }
              
              peer.on('call', function (call) {
                console.log('%sにcallされました', members[call.peer]);
                $scope.log += members[call.peer] + "(" + call.peer + ") にcallされました。\n";
                $scope.$apply();
                
                flag_talking = true;
                call.answer(stream);
              });
            });
          
            // 今までのログを取得
            socket.on('getChats', function (data) {
              if(data.id == socket.id) {
                for(var c in data.chats) {
                  $scope.chat += data.chats[c] + "\n";
                }
              }
              $scope.$apply();
            });
          
            // 受信した全てのP2Pkeyをaudio要素に変換する
            socket.on('member', function (m) {
              if (peer.id == null) {
                $scope.log += "[エラー] Peerサーバに接続できませんでした。\n";
                return;
              }
              
              members = m;
              
              var audios = document.querySelector('#audios');
              audios.innerHTML = '';
              
              delete m[socket.id]; // 自分自身を無視
              
              flag_talking = false;
              
              var memberCount = 0;
              $scope.log += "Member: [ ";
              
              for(var key in m) {
                var call = peer.call(key, stream);
                
                if (call === undefined) {
                  console.log(key + 'なんて居ません');
                  $scope.log += key + "なんて居ません。\n";
                  console.log(peer);
                  $scope.$apply();
                  
                  return;
                }
                
                flag_talking = true;
                call.on('stream', function (remoteStream) {
                  var audio = new Audio;
                  audio.src = URL.createObjectURL(remoteStream);
                  audio.controls = true;
                  audio.play();
          
                  audios.appendChild(audio);

                });
                
                if (memberCount == 0) {
                  $scope.log += m[key];
                } else {
                  $scope.log += " / " + m[key];
                }
                
                memberCount++;
              }
              
              $scope.log += " ]\n(" + memberCount + "人)\n";
              $scope.$apply();
            });
            
            // Chat受信時 chat = name, message
            socket.on('chat', function(chat) {
              $scope.chat = chat.name + " : " + chat.message + "\n" + $scope.chat;
              $scope.$apply();
            });
    
          }, function (error) {
            alert('ローカルストリームを取得できませんでした。\n(httpsでアクセスし、マイクの使用を許可してください。)\nFailed to get local stream.', error);
            
            $scope.log += "このブラウザは getUserMedia 対応\n";
            $scope.log += "ストリーム取得失敗\n";
            $scope.$apply();
          });
        } else {
          alert("お使いのブラウザには対応していません。\ngetUserMedia not supported.");
          
          $scope.log += "このブラウザは getUserMedia 非対応\n";
          $scope.$apply();
        }
      }
 
      function vr() {
          var recog = new webkitSpeechRecognition();
          recog.lang = 'ja-JP';
          recog.interimResults = true;
          recog.continuous = true;

          recog.onend = function() {
            // 認識終了
            $scope.mic_anime_visible = false;
            $scope.mic_stop_visible = true;
            
            $scope.interimArea = "[ 認識停止 ]";
            $scope.$apply();
          };

          recog.onsoundstart = function() {
              // 認識開始
              $scope.mic_anime_visible = true;
              $scope.mic_stop_visible = false;
              
              $scope.interimArea = "[ 認識開始 ]";
              $scope.$apply();
          };
          
          recog.onnomatch = function() {
            // もう一度試してください
            $scope.interimArea = "[ もう一度発声してください ]";
            $scope.$apply();
          };
          recog.onerror = function() {
            // エラー
            $scope.interimArea = "[ 認識エラー ]";
            $scope.$apply();
            
            if(!flag_speech)
              vr();
          };
          recog.onsoundend = function() {
            // 停止中
            $scope.interimArea = "[ 停止中 ]";
            $scope.$apply();
              
            vr();
          };

          recog.onresult = function(e) {
              for (var i = e.resultIndex; i < event.results.length; i++) {
                var result = e.results.item(i);
                if (result.isFinal)
                {
                  if (flag_talking) {
                    socket.emit("chat", result.item(0).transcript);
                    
                    $scope.interimBtnDisabled = true;
                    $scope.cancelBtnDisabled = true;
                    $scope.$apply();
                  }
                  
                  vr();
                }
                else
                {
                  interimText = result.item(0).transcript;
                  flag_speech = true;
                  
                  $scope.interimArea = interimText;
                  if (flag_talking) {
                    $scope.interimBtnDisabled = false;
                    $scope.cancelBtnDisabled = false;
                  }
                  $scope.$apply();
                }
              }
          }
          
          flag_speech = false;
          recog.start();
      }
    
  }]);