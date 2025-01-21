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
      if (
        !$scope.bestScore ||
        typeof $scope.bestScore.moves === "undefined" ||
        typeof $scope.bestScore.time === "undefined"
      ) {
        $scope.bestScore = { moves: Infinity, time: Infinity };
      }
      if (
        newMoves < $scope.bestScore.moves ||
        (newMoves === $scope.bestScore.moves || newTime < $scope.bestScore.time)
      ) {
        $scope.bestScore.moves = newMoves;
        $scope.bestScore.time = newTime;
        try {
          await dbService.saveBestScoreToIDB(loggedInUser, $scope.bestScore); 
          console.log("Saved bestScore to IDB:", $scope.bestScore);
        } catch (err) {
          console.error("Failed to save bestScore:", err);
        }
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
            $scope.bestScore = userRecord.bestScore;
          }
          $scope.generateCardGrid();
          $scope.startTimer();
          $scope.displayBestScore();
        })
        .catch(err => {
          console.error("Error opening DB:", err);
        });
    };

    $scope.initGame();

    
  }
]);
