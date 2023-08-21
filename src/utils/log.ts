import chalk from 'chalk';

// eslint-disable-next-line no-console
const Log = (logs: string[]) => console.log(`${chalk.blue('[openAPI]')}: ${logs.join('\n')}`);

export default Log;