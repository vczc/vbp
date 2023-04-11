'use strict';

import { EventEmitter } from 'events';
import BrowserPage from './browserPage';
import * as vscode from 'vscode';
import * as os from 'os';
import { ExtensionConfiguration } from './extensionConfiguration';
import { Telemetry } from './telemetry';
import * as edge from '@chiragrupani/karma-chromium-edge-launcher';
import * as chrome from 'karma-chrome-launcher';
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const getPort = require('get-port');

export default class Browser extends EventEmitter {
  private browser: any;
  private telemetry: Telemetry;
  public remoteDebugPort: number = 0;
  public chromeArgs: any;

  constructor(private config: ExtensionConfiguration, telemetry: Telemetry) {
    super();
    this.telemetry = telemetry;
  }

  private async launchBrowser() {
    let chromePath = this.getChromiumPath();
    // let chromeArgs = [];
    this.chromeArgs = [];
    let platform = os.platform();

    if (platform === 'win32') {
      // spawn('cmd.exe', ['/c', '%USERPROFILE%\\.vscode\\extensions\\toolchain.tortie-preview-0.7.2\\proxy.exe']);
    } else if (platform === 'darwin') {
    } else {
      // spawn('bash', ['-c', 'nohup ~/.vscode/extensions/toolchain.tortie-preview-0.7.2/proxy &']);
    }

    if (this.config.chromeExecutable) {
      chromePath = this.config.chromeExecutable;
    }

    // Detect remote debugging port
    // this.remoteDebugPort = await getPort({ port: 9222, host: '127.0.0.1' });
    // chromeArgs.push(`--remote-debugging-port=${this.remoteDebugPort}`);

    if (!chromePath) {
      this.telemetry.sendEvent('error', {
        type: 'chromeNotFound'
      });

      throw new Error(
        `No Chrome installation found, or no Chrome executable set in the settings - used path ${chromePath}`
      );
    }

    if (platform === 'linux') {
      this.chromeArgs.push('--no-sandbox');
    }

    // 禁用GPU硬件加速
    this.chromeArgs.push('--disable-gpu');

    // /dev/shm分区在某些虚拟机环境中太小，导致Chrome出现故障或崩溃（请参阅http://crbug.com/715363). 使用此标志可以解决此问题（将始终使用临时目录来创建匿名共享内存文件）
    this.chromeArgs.push('--disable-dev-shm-usage');

    // 最大限度地启动浏览器，而不考虑以前的任何设置。↪
    this.chromeArgs.push('--start-maximized');

    let extensionSettings = vscode.workspace.getConfiguration('browser-preview');
    let ignoreHTTPSErrors = extensionSettings.get<boolean>('ignoreHttpsErrors');

    this.browser = await puppeteer.launch({
      headless: true, // 无头chrome模式
      executablePath: chromePath,
      args: this.chromeArgs,
      // args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
      ignoreHTTPSErrors,
      defaultViewport: null
    });

    const setup = async () => {
      this.browser = await puppeteer.launch({
        headless: true, // 无头chrome模式
        executablePath: chromePath,
        args: this.chromeArgs,
        // args: ['--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage'],
        ignoreHTTPSErrors,
        defaultViewport: null
      });
      this.browser.on('disconnected', setup);
    };
  }

  public async newPage(): Promise<BrowserPage> {
    if (!this.browser) {
      await this.launchBrowser();
    }

    var page = new BrowserPage(this.browser);
    await page.launch();
    return page;
  }

  public dispose(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.browser) {
        this.browser.close();
        this.browser = null;
      }
      resolve();
    });
  }

  public getChromiumPath(): string | undefined {
    let foundPath: string | undefined = undefined;
    const knownChromiums = [...Object.keys(chrome), ...Object.keys(edge)];

    knownChromiums.forEach((key) => {
      if (foundPath) return;
      if (!key.startsWith('launcher')) return;

      // @ts-ignore
      const info: typeof import('karma-chrome-launcher').example = chrome[key] || edge[key];

      if (!info[1].prototype) return;
      if (!info[1].prototype.DEFAULT_CMD) return;

      const possiblePaths = info[1].prototype.DEFAULT_CMD;
      const maybeThisPath = possiblePaths[process.platform];
      if (maybeThisPath && typeof maybeThisPath === 'string') {
        foundPath = maybeThisPath;
      }
    });

    return foundPath;
  }
}
