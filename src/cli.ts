#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { deploy, DeployOptions } from './index';
import { logger } from './logger';

const program = new Command();

program
  .name('fast-deploy')
  .description('Deploy to remote server using SFTP')
  .version('1.0.0')
  .option('-m, --mode <mode>', 'Deployment mode (e.g., dev, test, prod)')
  .option('--dev', 'Shortcut for --mode dev (read .fastdeploy.dev)')
  .option('--test', 'Shortcut for --mode test (read .fastdeploy.test)')
  .option('--uat', 'Shortcut for --mode uat (read .fastdeploy.uat)')
  .option('--prod', 'Shortcut for --mode prod (read .fastdeploy.prod)')
  .option('-c, --config <path>', 'Custom config file path')
  .addHelpText('after', `

Configuration (.fastdeploy):
  The configuration file should be a JSON file with the following structure:

  {
    "localPath": "dist",
    "remotePath": "/var/www/html/my-app",
    "server": {
      "host": "192.168.1.100",
      "username": "user",
      "password": "password",
      "// OR": "privateKeyPath: '/path/to/key'",
      "port": 22
    },
    "backupPath": "/var/www/backups"
  }
`)
  .action(async (options) => {
    try {
        // Determine mode
        let mode = options.mode;
        if (options.dev) mode = 'dev';
        if (options.test) mode = 'test';
        if (options.prod) mode = 'prod';
        if (options.uat) mode = 'uat';

        // Determine config file
        let configPath: string;
        const baseConfig = '.fastdeploy';

        if (options.config) {
            configPath = path.resolve(process.cwd(), options.config);
        } else {
            if (mode) {
                const envConfig = `${baseConfig}.${mode}`;
                const envConfigPath = path.resolve(process.cwd(), envConfig);
                if (fs.existsSync(envConfigPath)) {
                    configPath = envConfigPath;
                } else {
                    // Fallback
                    logger.warn(`Configuration file ${envConfig} not found. Falling back to default ${baseConfig}.`);
                    configPath = path.resolve(process.cwd(), baseConfig);
                }
            } else {
                configPath = path.resolve(process.cwd(), baseConfig);
            }
        }

        if (!fs.existsSync(configPath)) {
            logger.error(`Error: Configuration file not found at ${configPath}`);
            process.exit(1);
        }

        logger.info(`Using configuration file: ${configPath}`);
        
        // Read config
        const configContent = fs.readFileSync(configPath, 'utf-8');
        let config: DeployOptions;
        
        try {
            config = JSON.parse(configContent);
        } catch (e) {
            logger.error('Error parsing configuration file. Make sure it is valid JSON.');
            process.exit(1);
        }

        // Validate config basic
        if (!config.server || !config.remotePath) {
            logger.error('Error: Config must contain "server" and "remotePath".');
            process.exit(1);
        }

        // Run deploy
        await deploy(config);

    } catch (error) {
        logger.error('Deployment failed:', error);
        process.exit(1);
    }
  });

program.parse();
