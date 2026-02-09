import { logger } from './logger';
import { ServerConfig } from './index';

export function handleDeployError(err: any, server: ServerConfig, remotePath: string): void {
  // Handle specific permission errors, especially for directory creation
  if (err.message && (err.message.includes('Permission denied') || err.code === 'EACCES')) {
    logger.error('\nError: Permission denied accessing or creating remote directory.');
    logger.error(`Target path: ${remotePath}`);
    logger.warn('Possible reasons:');
    logger.warn('1. The remote directory does not exist, and the current user does not have permission to create it.');
    logger.warn('2. The current user does not have write permission for the existing remote directory.');
    logger.warn('Please verify the remote path and user permissions on the server.\n');
    return;
  }

  // Handle authentication errors
  if (err.message && (err.message.includes('All configured authentication methods failed') || err.level === 'client-authentication')) {
    logger.error('\nError: SSH authentication failed.');
    logger.error(`Host: ${server.host}`);
    logger.error(`Username: ${server.username}`);
    logger.warn('Possible reasons:');
    logger.warn('1. Incorrect password or private key.');
    logger.warn('2. Incorrect username.');
    logger.warn('3. The server does not support the configured authentication method.');
    logger.warn('Please verify your credentials and server configuration.\n');
    return;
  }

  // Handle connection timeout or host not found
  if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
    logger.error('\nError: Could not connect to server.');
    logger.error(`Host: ${server.host}`);
    logger.error(`Port: ${server.port || 22}`);
    logger.warn('Possible reasons:');
    logger.warn('1. The hostname or IP address is incorrect.');
    logger.warn('2. The server is down or not reachable.');
    logger.warn('3. The port is blocked by a firewall.');
    logger.warn('Please check your network connection and server status.\n');
    return;
  }
}
