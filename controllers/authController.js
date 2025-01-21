app.controller('AuthController', [
  '$scope',
  '$state',
  'dbService', 
  function($scope, $state, dbService) {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser')) || null;
    if (loggedInUser) {
      $state.go('game');
      return;
    }
    

    $scope.signup = async function(user) {
      try {
        user.password = CryptoJS.SHA256(user.password).toString();
        const db = await dbService.openIndexedDB();

        const usernameTaken = await dbService.checkUsernameExists(db, user.username);
        if (usernameTaken) {
          alert('Username is taken. Please choose another.');
          return;
        }

        const emailTaken = await dbService.checkEmailExists(db, user.email);
        if (emailTaken) {
          alert('Email is already in use. Please use another.');
          return;
        }

        const newUser = {
          username: user.username, 
          email: user.email,
          password: user.password,
          bestScore: { moves: 0, time: 0 }
        };

        await dbService.addUser(db, newUser);
        alert('Sign-Up Successful! You can now log in.');
        $state.go('signin');

      } catch (error) {
        console.error('Error during sign-up:', error);
        alert('Something went wrong. Please try again later.');
      }
    };

    $scope.signin = async function(user) {
      try {
        user.password = CryptoJS.SHA256(user.password).toString();
        const db = await dbService.openIndexedDB();

        const userRecord = await dbService.getUserByEmail(db, user.email);
        if (!userRecord) {
          alert('No account with that email. Please check again.');
          return;
        }

        if (userRecord.password === user.password) {
          localStorage.setItem('loggedInUser', JSON.stringify(userRecord.username));
          alert(`Welcome, ${userRecord.username}!`);
          $state.go('game');
        } else {
          alert('Invalid password. Please try again.');
        }

      } catch (error) {
        console.error('Error during sign-in:', error);
        alert('Failed to sign in. Please try again.');
      }
    };
  }
]);
