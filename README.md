How to run locally:
1. Clone from main branch
2. Create a file called .env in the api directory, paste this in the file:
Find what to paste in pdf "How to run locally" which was submitted.
3. Create a file called copper-moon-387900-f44be043d6f4.json in the api directory, paste this in the file:
Find what to paste in pdf "How to run locally" which was submitted.
4. In the terminal cd to the api directory and run "npm install"
5. Once installed type "npm run dev", it should run on port 5000
6. In the frontend directory, create a .env file and paste this:
Find what to paste in pdf "How to run locally" which was submitted.
7.Go to the file Filemanagerpage in frontend-src-components and change the link on line 27 from 'https://api-sd-project-fea6akbyhygsh0hk.southafricanorth-01.azurewebsites.net' to 'https://localhost:5000'
8.Go to the file SearchPage in frontend-src-components and change the link on line 54 from 'https://api-sd-project-fea6akbyhygsh0hk.southafricanorth-01.azurewebsites.net' to 'https://localhost:5000'
9.Then in the terminal cd to frontend and type "npm install --legacy-peer-deps"
10.Then run in the frontend by typing "npm run dev"
11.If u run into any npm run dev issues then delete node modules and pakage-lock.Json and npm install again
12.Sign in with the following details to have full functionality of our app
Username:test5@example.com
password:12345678
