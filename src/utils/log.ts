import chalk from 'chalk';
import { getOutputChannel } from './outputChannel';

const channel = getOutputChannel();
// eslint-disable-next-line no-console
const Log = (...rest) => {

    // channel.show();
    // console.log(`${chalk.blue('[openAPI]')}: ${rest.join('\n')}`)
    channel.appendLine(`${chalk.blue('[openAPI]')}: ${rest.join('\n')}`)
};

export default Log;