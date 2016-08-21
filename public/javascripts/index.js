  angular.module('myApp', [])
  .controller('MyController', ['$scope', '$http', '$timeout', '$window',
    function($scope, $http, $timeout, $window) {
        var rec;
        $scope.log = "AngularJS 正常\n";
        $scope.startDisable = false;
        $scope.stopDisable = true;
        
        if($window.webkitSpeechRecognition) {
            $scope.log += "このブラウザは speechRecognition 対応\n";
            $scope.$apply();
            
            rec = new $window.webkitSpeechRecognition();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'ja-JP';
            
            rec.onresult = function(e) {
                var finalText = '';
                var interimText = '';
                
                for (var i = 0; i < e.results.length; i++) {
                    // isFinalがtrueの場合は確定した内容
                    if (e.results[i].isFinal) {
                        finalText += e.results[i][0].transcript + "\n";
                    } else {
                        interimText += e.results[i][0].transcript + "\n";
                    }
                }
                
                $scope.finalArea = finalText;
                $scope.interimArea = interimText;
                $scope.$apply();
                
            };
            
        } else {
            alert("このブラウザは speechRecognition 未対応です！");
            $scope.log += "このブラウザは speechRecognition 未対応\n";
            
            $scope.startDisable = true;
            $scope.stopDisable = true;
            
            $scope.$apply();
        }
        
        $scope.startRec = function() {
            if (rec) {
                rec.start();
                $scope.log += "認識開始\n";
                
                $scope.startDisable = true;
                $scope.stopDisable = false;
                
                $scope.$apply();
            }
        };
        
        $scope.stopRec = function() {
            if (rec) {
                rec.stop();
                $scope.log += "認識終了\n";
                
                $scope.startDisable = false;
                $scope.stopDisable = true;
                
                $scope.$apply();
            }
        };
        
        $scope.reset = function() {
            $scope.finalArea = "";
            $scope.interimArea = "";
            $scope.$apply();
        };
      
        var socket = io();
        socket.on('connect', function () {
            // 接続した時
            $scope.log += "Socket.io 接続正常\n";
            $scope.$apply();
        });
    
  }]);
  