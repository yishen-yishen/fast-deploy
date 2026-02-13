# fast-deploy

A simple and fast deployment tool for Node.js, based on `ssh2-sftp-client`.

## Features

- Upload a local directory to a remote server via SFTP.
- Optional backup of the remote directory before upload.
- Written in TypeScript with type definitions included.
- **CLI Support**: Initialize and deploy with simple commands.
- **Multi-environment Support**: Easily switch between dev, test, and prod configurations.

## Installation

### For use as a library:
```bash
npm install @yishen_/fast-deploy
```

### For use as a CLI tool:
Global installation:
```bash
npm install -g @yishen_/fast-deploy
```

Or run with npx:
```bash
npx @yishen_/fast-deploy
```

## CLI Usage

### 1. Initialize

Run the init command in your project root to generate a configuration file and add a deployment script to `package.json`.

```bash
fast-deploy init
```

This will:
- Create a `.fastdeploy` configuration file.
- Add `"publish": "fastdeploy"` to `scripts` in your `package.json`.
- Create a `.gitignore` (or update existing) with `.fastdeploy*`.

### 2. Configuration

Edit the `.fastdeploy` file (JSON format):

```json
{
  "localPath": "dist",
  "remotePath": "/var/www/html/my-app",
  "server": {
    "host": "192.168.1.100",
    "username": "user",
    "privateKeyPath": "/path/to/private/key",
    "// OR": "password: 'your-password'",
    "port": 22
  },
  "backupPath": "/var/www/backups"
}
```

### 3. Deploy

Run the deploy command (or use the npm script):

```bash
fast-deploy
# OR
npm run publish
```

### 4. Environments

You can support multiple environments by creating specific configuration files:

- `.fastdeploy` (Default)
- `.fastdeploy.dev` (Development)
- `.fastdeploy.test` (Testing)
- `.fastdeploy.prod` (Production)
- `.fastdeploy.uat` (UAT)

Run with specific environment:

```bash
fast-deploy --dev
# Reads .fastdeploy.dev. If not found, falls back to .fastdeploy

fast-deploy --test
# Reads .fastdeploy.test

fast-deploy --mode prod
# Reads .fastdeploy.prod

fast-deploy --config ./custom-config.json
# Uses specific config file
```

## Library Usage

```javascript
const { deploy } = require('fast-deploy');
// or
import { deploy } from 'fast-deploy';

deploy({
  localPath: 'dist', // local directory to upload, default is 'dist'
  remotePath: '/var/www/html/my-app', // remote directory
  server: {
    host: '192.168.1.100',
    username: 'user',
    password: 'password', // or privateKey
    port: 22 // default is 22
  },
  backupPath: '/var/www/backups' // optional: backup remotePath to this directory before upload
})
.then(() => {
  console.log('Deployment success!');
})
.catch(err => {
  console.error('Deployment failed:', err);
});
```

## Options

### `deploy(options)`

#### `options`

- `localPath` (string, optional): Path to the local directory to upload. Defaults to `'dist'`.
- `remotePath` (string, required): Path to the remote directory on the server.
- `server` (object, required): SFTP connection settings.
  - `host` (string): Server hostname or IP.
  - `username` (string): SSH username.
  - `password` (string, optional): SSH password.
  - `privateKey` (string, optional): Private key content (Buffer or string).
  - `privateKeyPath` (string, optional): Absolute or relative path to private key file.
  - `port` (number, optional): SSH port. Default is 22.
- `backupPath` (string, optional): If provided, the current content of `remotePath` will be moved to a subdirectory inside `backupPath` with a timestamp.
