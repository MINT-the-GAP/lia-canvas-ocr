import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { access, readFile } from 'node:fs/promises';

import type {
  Browser,
  BrowserContext,
  Page,
} from 'playwright';

export const LIASCRIPT_STABLE_URL =
  process.env.LIASCRIPT_STABLE_URL ?? 'https://liascript.github.io/course/';

export const SYNTHETIC_ORIGIN = 'https://lia-canvas-ocr.invalid';
export const NO_CANVAS_COURSE_URL = `${SYNTHETIC_ORIGIN}/courses/chromium-131-repro.md`;
export const CANVAS_COURSE_URL = `${SYNTHETIC_ORIGIN}/courses/canvas-interactions.md`;
export const TEMPLATE_URL = `${SYNTHETIC_ORIGIN}/template.md`;
export const BUNDLE_URL = `${SYNTHETIC_ORIGIN}/dist/index.js`;

const DEFAULT_WINDOWS_CHROMIUM_131 =
  'C:\\Users\\MaSaLo\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe';

export const CHROMIUM_131_EXECUTABLE_PATH =
  process.env.CHROMIUM_131_EXECUTABLE_PATH ??
  process.env.CHROMIUM_131_PATH ??
  (process.platform === 'win32' ? DEFAULT_WINDOWS_CHROMIUM_131 : '');

const FIXTURE_URLS = {
  [NO_CANVAS_COURSE_URL]: new URL('../fixtures/chromium-131-repro.md', import.meta.url),
  [CANVAS_COURSE_URL]: new URL('../fixtures/canvas-interactions.md', import.meta.url),
  [TEMPLATE_URL]: new URL('../fixtures/lia-canvas-ocr-local.md', import.meta.url),
  [BUNDLE_URL]: new URL('../../dist/index.js', import.meta.url),
} as const;

export type Diagnostics = {
  diagnosticsReady: boolean;
  observerCallbacks: number;
  rootStyleMutations: number;
  domMutationRecords: number;
  themeEvents: number;
  rootCanvasWrites: number;
  longTaskCount: number;
  longTaskDuration: number;
  maxLongTaskDuration: number;
  totalRootStyleMutations: number;
  totalThemeEvents: number;
  totalRootCanvasWrites: number;
  runawayStopped: boolean;
  unhandledRejections: string[];
};

export type BrowserHarness = {
  context: BrowserContext;
  page: Page;
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
  modelRequests: string[];
  routeHits: Record<string, number>;
  bundleContentType: () => string;
};

export async function pathExists(path: string): Promise<boolean> {
  if (!path) return false;
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function hostDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function withHostTimeout<T>(
  promise: Promise<T>,
  label: string,
  timeoutMs = 3_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} did not respond within ${timeoutMs} ms`)),
      timeoutMs,
    );
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function installBrowserDiagnostics(context: BrowserContext): Promise<void> {
  return context.addInitScript(() => {
    const NativeMutationObserver = window.MutationObserver;
    const nativeSetProperty = CSSStyleDeclaration.prototype.setProperty;
    const nativeDispatchEvent = Document.prototype.dispatchEvent;
    const metrics = {
      diagnosticsReady: false,
      observerCallbacks: 0,
      rootStyleMutations: 0,
      domMutationRecords: 0,
      themeEvents: 0,
      rootCanvasWrites: 0,
      longTaskCount: 0,
      longTaskDuration: 0,
      maxLongTaskDuration: 0,
      totalRootStyleMutations: 0,
      totalThemeEvents: 0,
      totalRootCanvasWrites: 0,
      runawayStopped: false,
      unhandledRejections: [],
    };

    Object.defineProperty(window, '__liaCanvasTestDiagnostics', {
      configurable: false,
      enumerable: false,
      value: metrics,
    });

    CSSStyleDeclaration.prototype.setProperty = function(name, value, priority) {
      const root = document.documentElement;
      if (
        root &&
        this === root.style &&
        (String(name).startsWith('--canvas-') || String(name).startsWith('--lia-ocrbar-'))
      ) {
        metrics.rootCanvasWrites += 1;
        metrics.totalRootCanvasWrites += 1;
      }
      return nativeSetProperty.call(this, name, value, priority);
    };

    Document.prototype.dispatchEvent = function(event) {
      if (event && event.type === 'lia-canvas-theme') {
        metrics.themeEvents += 1;
        metrics.totalThemeEvents += 1;
      }
      return nativeDispatchEvent.call(this, event);
    };

    window.MutationObserver = class extends NativeMutationObserver {
      constructor(callback) {
        super((records, observer) => {
          metrics.observerCallbacks += 1;
          let rootStyleRecords = 0;
          for (const record of records) {
            if (
              record.type === 'attributes' &&
              record.target === document.documentElement &&
              record.attributeName === 'style'
            ) {
              rootStyleRecords += 1;
            }
          }
          metrics.rootStyleMutations += rootStyleRecords;
          metrics.totalRootStyleMutations += rootStyleRecords;

          // A broken build otherwise starves the renderer forever. Disconnecting
          // only after a clearly runaway threshold lets the test report a normal
          // assertion failure instead of hanging the whole Node test process.
          if (metrics.totalRootStyleMutations > 2_000) {
            metrics.runawayStopped = true;
            observer.disconnect();
            return;
          }
          callback(records, observer);
        });
      }
    };

    const startMutationCounter = () => {
      if (!document.documentElement || metrics.diagnosticsReady) return;
      metrics.diagnosticsReady = true;
      new NativeMutationObserver(records => {
        metrics.domMutationRecords += records.length;
      }).observe(document.documentElement, {
        attributes: true,
        characterData: true,
        childList: true,
        subtree: true,
      });
    };
    if (document.documentElement) startMutationCounter();
    else document.addEventListener('DOMContentLoaded', startMutationCounter, { once: true });

    window.addEventListener('unhandledrejection', event => {
      const reason = event.reason;
      metrics.unhandledRejections.push(
        String((reason && (reason.stack || reason.message)) || reason || 'unknown rejection'),
      );
    });

    try {
      if (
        typeof PerformanceObserver === 'function' &&
        Array.isArray(PerformanceObserver.supportedEntryTypes) &&
        PerformanceObserver.supportedEntryTypes.includes('longtask')
      ) {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            metrics.longTaskCount += 1;
            metrics.longTaskDuration += entry.duration;
            metrics.maxLongTaskDuration = Math.max(metrics.maxLongTaskDuration, entry.duration);
          }
        }).observe({ type: 'longtask', buffered: true });
      }
    } catch {
      // Firefox/WebKit may not implement the Long Tasks API.
    }
  });
}

export async function createHarness(
  browser: Browser,
  options: { hasTouch?: boolean } = {},
): Promise<BrowserHarness> {
  const fixtureEntries = await Promise.all(
    Object.entries(FIXTURE_URLS).map(async ([url, file]) => [
      url,
      await readFile(file, 'utf8'),
    ] as const),
  );
  const fixtures = Object.fromEntries(fixtureEntries);
  const routeHits: Record<string, number> = {};
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const requestFailures: string[] = [];
  const modelRequests: string[] = [];
  let bundleMime = '';

  const context = await browser.newContext({
    colorScheme: 'light',
    hasTouch: options.hasTouch ?? false,
    serviceWorkers: 'block',
    viewport: { width: 1280, height: 900 },
  });
  await installBrowserDiagnostics(context);

  for (const [url, body] of Object.entries(fixtures)) {
    await context.route(url, route => {
      routeHits[url] = (routeHits[url] ?? 0) + 1;
      const isBundle = url === BUNDLE_URL;
      return route.fulfill({
        status: 200,
        contentType: isBundle
          ? 'application/javascript; charset=utf-8'
          : 'text/plain; charset=utf-8',
        headers: {
          'access-control-allow-origin': '*',
          'cache-control': 'no-store',
          'x-content-type-options': 'nosniff',
        },
        body,
      });
    });
  }

  const page = await context.newPage();
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', error => {
    pageErrors.push(error.stack ?? error.message);
  });
  page.on('request', request => {
    if (/transformers|huggingface|onnx|texify2/i.test(request.url())) {
      modelRequests.push(request.url());
    }
  });
  page.on('requestfailed', request => {
    if (request.url().startsWith(SYNTHETIC_ORIGIN)) {
      requestFailures.push(
        `${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`,
      );
    }
  });
  page.on('response', response => {
    if (response.url() === BUNDLE_URL) {
      bundleMime = response.headers()['content-type'] ?? '';
    }
  });

  return {
    context,
    page,
    consoleErrors,
    pageErrors,
    requestFailures,
    modelRequests,
    routeHits,
    bundleContentType: () => bundleMime,
  };
}

export async function openCourse(
  harness: BrowserHarness,
  courseUrl: string,
  readySelector?: string,
): Promise<void> {
  const href = `${LIASCRIPT_STABLE_URL}?${courseUrl}#1`;
  await harness.page.goto(href, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });

  await withHostTimeout(
    harness.page.waitForFunction(
      () => Boolean(window.__liaCanvasTestDiagnostics?.diagnosticsReady),
      undefined,
      { timeout: 30_000 },
    ),
    'diagnostics bootstrap',
    35_000,
  );
  if (readySelector) {
    await withHostTimeout(
      harness.page.waitForSelector(readySelector, {
        state: 'attached',
        timeout: 30_000,
      }),
      `selector ${readySelector}`,
      35_000,
    );
  } else {
    await withHostTimeout(
      harness.page.waitForFunction(
        () => Boolean(window.__LIA_CANVAS_OCR__),
        undefined,
        { timeout: 30_000 },
      ),
      'lia-canvas-ocr registry',
      35_000,
    );
  }
}

export function snapshotDiagnostics(page: Page): Promise<Diagnostics> {
  return withHostTimeout(
    page.evaluate(() => ({ ...window.__liaCanvasTestDiagnostics })),
    'renderer diagnostics',
  );
}

export function resetIdleDiagnostics(page: Page): Promise<void> {
  return withHostTimeout(
    page.evaluate(() => {
      const metrics = window.__liaCanvasTestDiagnostics;
      metrics.observerCallbacks = 0;
      metrics.rootStyleMutations = 0;
      metrics.domMutationRecords = 0;
      metrics.themeEvents = 0;
      metrics.rootCanvasWrites = 0;
      metrics.longTaskCount = 0;
      metrics.longTaskDuration = 0;
      metrics.maxLongTaskDuration = 0;
      metrics.unhandledRejections.length = 0;
    }),
    'reset idle diagnostics',
  );
}

export function assertSyntheticDelivery(harness: BrowserHarness, courseUrl: string): void {
  assert.ok(harness.routeHits[courseUrl] >= 1, 'synthetic course was not requested');
  assert.ok(harness.routeHits[TEMPLATE_URL] >= 1, 'synthetic template was not requested');
  assert.ok(harness.routeHits[BUNDLE_URL] >= 1, 'synthetic bundle was not requested');
  assert.match(
    harness.bundleContentType(),
    /^application\/javascript(?:;|$)/i,
    'bundle must be served with a JavaScript MIME type',
  );
  assert.deepEqual(harness.requestFailures, [], harness.requestFailures.join('\n'));
}

export function assertNoRuntimeErrors(
  harness: BrowserHarness,
  diagnostics: Diagnostics,
): void {
  assert.deepEqual(harness.consoleErrors, [], harness.consoleErrors.join('\n\n'));
  assert.deepEqual(harness.pageErrors, [], harness.pageErrors.join('\n\n'));
  assert.deepEqual(
    diagnostics.unhandledRejections,
    [],
    diagnostics.unhandledRejections.join('\n\n'),
  );
}

declare global {
  interface Window {
    __LIA_CANVAS_OCR__?: {
      barBoot?: boolean;
      canvasBoot?: boolean;
      ocr?: unknown;
      store?: Record<string, unknown>;
    };
    __liaCanvasTestDiagnostics: Diagnostics;
    __liaCanvasRemovedListeners?: Array<{
      target: 'document' | 'window';
      type: string;
    }>;
    __liaCanvasRestoreRemoveEventListener?: () => void;
  }
}
