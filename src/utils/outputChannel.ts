import { window } from 'vscode';

const channel = window.createOutputChannel('andy');

export const getOutputChannel = () => channel;
