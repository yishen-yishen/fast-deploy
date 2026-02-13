import Client from 'ssh2-sftp-client';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';
import { handleDeployError } from './errorHandler';

export interface ServerConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  privateKey?: string;
  privateKeyPath?: string;
  passphrase?: string;
}

export interface DeployOptions {
  localPath?: string;
  remotePath: string;
  server: ServerConfig;
  backupPath?: string;
}

export async function deploy(options: DeployOptions): Promise<void> {
  const {
    localPath = 'dist',
    remotePath,
    server,
    backupPath
  } = options;

  const sftp = new Client();

  try {
    // Validate server config
    if (!server.host || (!server.password && !server.privateKey && !server.privateKeyPath)) {
      logger.error('Server configuration must include host and either password or private key.');
      return;
    }
    
    // Handle privateKeyPath
    const serverConfig = { ...server };
    if (serverConfig.privateKeyPath && !serverConfig.privateKey) {
      let keyPath = serverConfig.privateKeyPath;
      if (!path.isAbsolute(keyPath)) {
        keyPath = path.resolve(process.cwd(), keyPath);
      }
      
      if (fs.existsSync(keyPath)) {
        serverConfig.privateKey = fs.readFileSync(keyPath, 'utf-8');
      } else {
        logger.warn(`Warning: Private key file not found at ${keyPath}`);
      }
    }
    
    // Remove privateKeyPath before passing to connect just in case, though usually ignored
    delete serverConfig.privateKeyPath;

    logger.info(`Connecting to ${server.host}...`);
    await sftp.connect(serverConfig);
    logger.info('Connected.');

    // Resolve local path
    const resolvedLocalPath = path.resolve(process.cwd(), localPath);
    if (!fs.existsSync(resolvedLocalPath)) {
      throw new Error(`Local path does not exist: ${resolvedLocalPath}`);
    }

    // Backup
    if (backupPath) {
      const exists = await sftp.exists(remotePath);
      if (exists) {
        logger.info(`Backing up ${remotePath} to ${backupPath}...`);
        // Ensure backup directory exists
        const backupDirExists = await sftp.exists(backupPath);
        if (!backupDirExists) {
            // Create backup root directory if it doesn't exist
            // true for recursive
            await sftp.mkdir(backupPath, true);
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupTarget = path.posix.join(backupPath, path.basename(remotePath) + '-' + timestamp);
        
        await sftp.rename(remotePath, backupTarget);
        logger.info(`Backup created at ${backupTarget}`);
      } else {
        logger.info(`Remote path ${remotePath} does not exist, skipping backup.`);
      }
    }

    // Upload
    logger.info(`Uploading ${resolvedLocalPath} to ${server.host}:${remotePath}...`);
    
    await sftp.uploadDir(resolvedLocalPath, remotePath);
    logger.success('deploy completed successfully.');

  } catch (err: any) {
    handleDeployError(err, server, remotePath);
    logger.error('Deployment failed:', err);
    throw err;
  } finally {
    await sftp.end();
  }
}
