app.controller('GameController', [
  '$scope',
  '$timeout',
  '$interval',
  '$state',
  'dbService', 
  function ($scope, $timeout, $interval, $state, dbService) {
    $scope.cards = [];
    $scope.flippedCards = [];
    $scope.matchedCards = [];
    $scope.moves = 0;
    $scope.timer = "00:00";
    $scope.bestScore = null;
    $scope.bestScoreDisplay = "N/A";
    let timerInterval = null;
    let startTime = null;
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || null;
    
    if (!loggedInUser) {
      $state.go('signin');
      return;
    }

    $scope.goToDashboard = function() {
      $state.go('dashboard');
    };

    $scope.displayBestScore = function () {
      if (
        !$scope.bestScore ||
        typeof $scope.bestScore.moves === "undefined" ||
        typeof $scope.bestScore.time === "undefined" ||
        $scope.bestScore.moves === Infinity
      ) {
        $scope.bestScoreDisplay = "N/A";
      } else {
        $scope.bestScoreDisplay = `${$scope.bestScore.moves} moves , ${$scope.bestScore.time} seconds`;
      }
    };

    $scope.generateCardGrid = function () {
      const symbols = ["🍎", "🍌", "🍇", "🍓", "🍒", "🍉", "🥝", "🍍"];
      $scope.cards = shuffle([...symbols, ...symbols]).map((symbol, index) => ({
        symbol,
        index,
        flipped: false,
        matched: false
      }));
    };

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    $scope.flipCard = function (card) {
      if (card.flipped || card.matched || $scope.flippedCards.length === 2) return;
      card.flipped = true;
      $scope.flippedCards.push(card);
      if ($scope.flippedCards.length === 2) {
        checkForMatch();
      }
    };

    function checkForMatch() {
      const [card1, card2] = $scope.flippedCards;
      if (card1.symbol === card2.symbol) {
        card1.matched = true;
        card2.matched = true;
        $scope.matchedCards.push(card1, card2);
        $scope.flippedCards = [];
        if ($scope.matchedCards.length === $scope.cards.length) {
          endGame();
        }
      } else {
        $timeout(() => {
          card1.flipped = false;
          card2.flipped = false;
          $scope.flippedCards = [];
        }, 450);
      }
      $scope.moves++;
    }

    $scope.startTimer = function () {
      startTime = Date.now();
      timerInterval = $interval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        $scope.timer = formatTime(elapsedTime);
      }, 1000);
    };

    $scope.stopTimer = function () {
      if (timerInterval) {
        $interval.cancel(timerInterval);
      }
    };

    function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function endGame() {
      $scope.stopTimer();
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      alert(`Game Over! You completed the game in ${$scope.moves} moves and ${elapsedTime} seconds.`);
      const combinedScore = elapsedTime * $scope.moves;
      dbService.saveFinalScoreToIDB(loggedInUser, combinedScore)
        .then(() => console.log("Appended a new score to user’s array:", combinedScore))
        .catch(err => console.error("Error storing finalScore:", err));
    
      $scope.updateBestScore($scope.moves, elapsedTime);
    }
    
    
    $scope.updateBestScore = async function (newMoves, newTime) {
      if (!$scope.bestScore || typeof $scope.bestScore.moves === "undefined" || typeof $scope.bestScore.time === "undefined") {
          console.log(`⚠️ No Best Score Found. Initializing to Infinity.`);
          $scope.bestScore = { moves: Infinity, time: Infinity };
      }
  
      console.log(`🔍 Comparing Scores | New Moves: ${newMoves}, Current Best Moves: ${$scope.bestScore.moves}`);
      console.log(`🔍 Comparing Times | New Time: ${newTime}, Current Best Time: ${$scope.bestScore.time}`);
  
      const isInitialBestScore = $scope.bestScore.moves === 0 && $scope.bestScore.time === 0;
  
      if (isInitialBestScore || newMoves < $scope.bestScore.moves || (newMoves === $scope.bestScore.moves && newTime < $scope.bestScore.time)) {
          console.log(`🆕 New Best Score Detected. Updating IndexedDB.`);
          $scope.bestScore = { moves: newMoves, time: newTime };
  
          try {
              await dbService.saveBestScoreToIDB(loggedInUser, $scope.bestScore);
              console.log(`Best Score Updated in IndexedDB:`, $scope.bestScore);
          } catch (err) {
              console.error(`Failed to Save Best Score:`, err);
          }
      } else {
          console.log(`New Score is Worse. Keeping Existing Best Score.`);
      }
  
      $scope.displayBestScore();
      $scope.restartGame();
  };
  
  
  

    $scope.restartGame = function () {
      $scope.stopTimer();
      $scope.moves = 0;
      $scope.matchedCards = [];
      $scope.flippedCards = [];
      $scope.timer = "00:00";
      $scope.generateCardGrid();
      $scope.startTimer();
      $scope.displayBestScore();
    };

    $scope.showLogoutModal = function () {
      $scope.isModalVisible = true;
    };

    $scope.confirmLogout = function () {
      localStorage.removeItem("loggedInUser");
      $state.go('signin');
    };

    $scope.cancelLogout = function () {
      $scope.isModalVisible = false;
    };

    $scope.initGame = function () {
      dbService.openIndexedDB()
          .then(async (db) => {
              const userRecord = await dbService.getUserRecord(db, loggedInUser);
              if (userRecord && userRecord.bestScore) {
                  console.log(`🎯 Retrieved Best Score from IndexedDB:`, userRecord.bestScore);
  
                  if (userRecord.bestScore.moves === 0 && userRecord.bestScore.time === 0) {
                      console.log(`⚠️ Found Initial 0 Values. Setting Best Score to Infinity.`);
                      $scope.bestScore = { moves: Infinity, time: Infinity };
                  } else {
                      $scope.bestScore = userRecord.bestScore;
                  }
              } else {
                  console.log(`⚠️ No Best Score Found. Setting Default.`);
                  $scope.bestScore = { moves: Infinity, time: Infinity };
              }
  
              $scope.generateCardGrid();
              $scope.startTimer();
              $scope.displayBestScore();
          })
          .catch(err => {
              console.error(`❌ Error Opening IndexedDB:`, err);
          });
  };
  
  

    $scope.initGame();

    
  }
]);
