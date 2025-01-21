app.controller('dashboardController', [
  '$scope', '$state', 'dbService',
  function ($scope, $state, dbService) {

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || null;
    if (!loggedInUser) {
      return;
    }

    let chartInstance = null; 
    $scope.scores = [];

    $scope.initDashboard = async function () {
      try {
        const db = await dbService.openIndexedDB();
        const allScores = await dbService.getScoresForUser(db, loggedInUser);

        allScores.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        const labels = allScores.map(item => formatDate(item.timestamp));
        const data = allScores.map(item => item.score);

        $scope.scores = allScores;

        const ctx = document.getElementById('scoreChart').getContext('2d');

        if (chartInstance) {
          chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Score Over Time',
              data: data,
              borderColor: '#6c63ff',
              backgroundColor: 'rgba(108, 99, 255, 0.2)',
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: '#ffffff',
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  color: '#ffffff'
                }
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'Timestamp', color: '#ffffff' },
                ticks: { color: '#ffffff' }
              },
              y: {
                title: { display: true, text: 'Score', color: '#ffffff' },
                beginAtZero: true,
                ticks: { color: '#ffffff' }
              }
            }
          }
        });

      } catch (err) {
        console.error("Error loading scores in Dashboard:", err);
      }
    };

    function formatDate(ts) {
      const d = new Date(ts);
      return d.toLocaleString();
    }

    $scope.goBackToGame = function () {
      $state.go('game');
    };

    $scope.initDashboard();
  }
]);
