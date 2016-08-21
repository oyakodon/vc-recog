  angular.module('myApp', [])
  .controller('MyController', ['$scope', '$http', '$timeout', '$document', '$window',
    function($scope, $http, $timeout, $document, $window) {
      $scope.log = "AngularJS 正常\n";
      $scope.chat = "";
      $scope.form_enabled = true;
      var socket;
      var recog;
      var recog_text = "";
      
      // 環境変更時、修正必須!
      var peerOptions = {
        host : "testpeerjs-oyakodon.c9users.io",
        path : '/',
        port : 8081,
        secure : true,
        key : 'peerjs',
        debug : 3
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
            
            recog = new $window.webkitSpeechRecognition();
            recog.continuous = true;
            recog.interimResults = true;
            recog.lang = 'ja-JP';
            
            recog.onresult = function(e) {
              var interimText = '';
              var finalText = e.results[e.results.length - 1][0].transcript;
              
              for (var i = 0; i < e.results.length; i++) {
                if (!e.results[i].isFinal) {
                    interimText += e.results[i][0].transcript + "\n";
                }
              }
              
              $scope.interimArea = interimText;
              
              if (recog_text != finalText){
                $timeout(function() {
                  $scope.log += "[音声認識] " + finalText + "\n";
                  socket.emit("chat", finalText); 
                }, 1000);
              }
              
              $scope.$apply();
              
            };
            
            
            recog.start();
          } else {
            $scope.log += "このブラウザは speechRecognition 非対応\n";
          }
          
          $scope.log += "getUserMedia 対応\n";
          $scope.form_enabled = false;
          
          var members = {};
          
          navigator.getUserMedia({ audio: true }, function (stream) {
            var peer;
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
                
                call.answer(stream);
              });
            });
          
            // 受信した全てのP2Pkeyをaudio要素に変換する
            socket.on('member', function (m) {
              if (peer.id == null) {
                alert("新しい通話を検出しました。リロードします。");
                $window.location.reload();
                return;
              }
              
              members = m;
              
              var audios = document.querySelector('#audios');
              audios.innerHTML = '';
              
              delete m[socket.id]; // 自分自身を無視
    
              for(var key in m) {
                var call = peer.call(key, stream);
                
                if (call === undefined) {
                  console.log(key + 'なんて居ません');
                  $scope.log += key + "なんて居ません。\n";
                  console.log(peer);
                  $scope.$apply();
                  
                  $window.rero
                  return;
                }
                
                call.on('stream', function (remoteStream) {
                  var audio = new Audio;
                  audio.src = URL.createObjectURL(remoteStream);
                  audio.controls = true;
                  audio.play();
          
                  audios.appendChild(audio);

                });
              }
            });
            
            // Chat受信時 chat = name, message
            socket.on('chat', function(chat) {
              $scope.chat += chat.name + " : " + chat.message + "\n";
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
    
  }]);