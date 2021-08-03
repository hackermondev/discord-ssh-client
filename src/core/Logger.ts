import chalk from 'chalk';

class Logger {
  private prefix: string;

  constructor(prefix?: string) {
    this.prefix = prefix || `[ssh bot logger]`;
  }

  debug(...text: [any]) {
    console.log(chalk.yellow(this.prefix, text));
  }

  log(...text: [any]) {
    console.log(chalk.green(this.prefix, text));
  }

  error(...text: [any]) {
    console.log(chalk.red(this.prefix, text));
  }
}

export default Logger;
