## Available Scripts

In the project directory, you can run:

### `npm run dev` or `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

### `npm run bump:patch || npm run bump:minor`

Bumps patch & minor versions. Should do before deploy.

### `npm run deploy`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

It then deploys the `dist` folder to Firebase.<br>
May need to reauth: `firebase login --reauth`

### `npm run sync`

Synchronize with DB. Runs the required CL commands.

From the cli subdirectory, testing can be done with the following:

`npm exec tsc && ./bin/run.js pull`

`npm exec tsc && ./bin/run.js push /Users/dogatech/Drive/music/db`

### Update DB

1. Update tables/fields in cli/push.ts
2. npm run datatypes
