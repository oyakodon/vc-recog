  angular.module('myApp', [])
  .controller('MyController', ['$scope', '$http', '$timeout', '$document', '$window',
    function($scope, $http, $timeout, $document, $window) {
      $scope.log = "";
      $scope.form_enabled = true;
      
      // peerjs
      navigator.getUserMedia = ( $window.navigator.getUserMedia ||
                       $window.navigator.webkitGetUserMedia ||
                       $window.navigator.mozGetUserMedia ||
                       $window.navigator.msGetUserMedia);
      
      $scope.startCall = function() {
      
        if (navigator.getUserMedia) {
          // サポートしている
          $scope.form_enabled = false;
          $scope.$apply();
          
          var members = {};
          
          navigator.getUserMedia({ audio: true }, function (stream) {
            var peer;
            var socket = io();
            
            socket.on('connect', function () {
              var name = $scope.name;
              
              console.log("socket.id: ", socket.id);
              console.log("Name: ", name);
              $scope.log += "ID: " + socket.id + "\n";
              $scope.log += "Name: " + name + "\n";
              $scope.$apply();
              
              socket.emit("connected", name);
              
              var options = {
                host : "testpeerjs-oyakodon.c9users.io",
                path : '/',
                port : 8081,
                secure : true,
                key : 'peerjs',
                debug : 3
              };
              peer = new Peer(socket.id, options);
              
              if (peer.id == null) {
                console.log('Cannot connect PeerServer.');
                $scope.log += "[エラー] Peerサーバに接続できませんでした。\n";
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
              members = m;
              
              var audios = document.querySelector('#audios');
              audios.innerHTML = '';
              
              delete m[socket.id]; // 自分自身を無視
    
              for(var key in m) {
                var call = peer.call(key, stream);
                
                if (call === undefined) {
                  console.log(key + 'なんて居ません');
                  $scope.log += "[エラー] " +  key + "なんて居ません。\n";
                  $scope.$apply();
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
          }, function (error) {
            alert('ローカルストリームを取得できませんでした。\n(httpsでアクセスし、マイクの使用を許可してください。)\nFailed to get local stream.', error);
          });
        } else {
          alert("お使いのブラウザには対応していません。\ngetUserMedia not supported.");
        }
      }
    
  }]);